package com.servichaya.feedback.service;

import com.servichaya.feedback.dto.PublicOpenPointRequestDto;
import com.servichaya.feedback.dto.PublicOpenPointResponseDto;
import com.servichaya.feedback.dto.PublicOpenPointResponseDto.SimpleAttachmentDto;
import com.servichaya.feedback.entity.OpenPointAttachment;
import com.servichaya.feedback.entity.PublicOpenPoint;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointPriority;
import com.servichaya.feedback.entity.PublicOpenPoint.OpenPointStatus;
import com.servichaya.feedback.repository.OpenPointAttachmentRepository;
import com.servichaya.feedback.repository.PublicOpenPointRepository;
import com.servichaya.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicOpenPointService {

    private final PublicOpenPointRepository openPointRepository;
    private final OpenPointAttachmentRepository attachmentRepository;
    private final NotificationService notificationService;

    @Value("${feedback.documents-path:./data/documents/Feedback/docs}")
    private String feedbackDocumentsPath;

    @Transactional
    public PublicOpenPointResponseDto createFromPublic(PublicOpenPointRequestDto request) {
        log.info("Creating public open point of type {} with title {}", request.getType(), request.getTitle());

        PublicOpenPoint openPoint = PublicOpenPoint.builder()
                .type(request.getType())
                .status(OpenPointStatus.NEW)
                .priority(OpenPointPriority.MEDIUM)
                .source("PUBLIC")
                .title(request.getTitle())
                .description(request.getDescription())
                .impactArea(request.getImpactArea())
                .url(request.getUrl())
                .environment(request.getEnvironment())
                .clientInfo(request.getClientInfo())
                .reporterName(request.getReporterName())
                .reporterEmail(request.getReporterEmail())
                .reporterMobile(request.getReporterMobile())
                .reporterRole(request.getReporterRole())
                .build();

        final PublicOpenPoint savedOpenPoint = openPointRepository.save(openPoint);

        // Persist simple URL-based attachments if provided
        if (request.getAttachmentUrls() != null && !request.getAttachmentUrls().isEmpty()) {
            List<OpenPointAttachment> attachments = request.getAttachmentUrls().stream()
                    .map(url -> OpenPointAttachment.builder()
                            .openPointId(savedOpenPoint.getId())
                            .fileUrl(url)
                            .attachmentType("EXTERNAL")
                            .displayOrder(0)
                            .build())
                    .collect(Collectors.toList());
            attachmentRepository.saveAll(attachments);
        }

        // TODO: In future, notify specific admin users when an open point is created.
        // Current Notification infrastructure requires a non-null userId, so we skip
        // system-wide notifications here to avoid DB constraint violations.

        return mapToResponse(savedOpenPoint, attachmentRepository.findByOpenPointIdOrderByDisplayOrderAsc(savedOpenPoint.getId()));
    }

    @Transactional(readOnly = true)
    public Page<PublicOpenPointResponseDto> getForAdmin(OpenPointStatus status,
                                                        PublicOpenPoint.OpenPointType type,
                                                        Pageable pageable) {
        Page<PublicOpenPoint> page;
        if (status != null && type != null) {
            page = openPointRepository.findByStatusAndType(status, type, pageable);
        } else if (status != null) {
            page = openPointRepository.findByStatus(status, pageable);
        } else if (type != null) {
            page = openPointRepository.findByType(type, pageable);
        } else {
            page = openPointRepository.findAll(pageable);
        }

        List<Long> ids = page.getContent().stream().map(PublicOpenPoint::getId).toList();
        List<OpenPointAttachment> attachments = ids.isEmpty()
                ? Collections.emptyList()
                : attachmentRepository.findByOpenPointIdInOrderByOpenPointIdAscDisplayOrderAsc(ids);

        Map<Long, List<OpenPointAttachment>> grouped = attachments.stream()
                .collect(Collectors.groupingBy(OpenPointAttachment::getOpenPointId));

        List<PublicOpenPointResponseDto> content = page.getContent().stream()
                .map(op -> mapToResponse(op, grouped.getOrDefault(op.getId(), Collections.emptyList())))
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PublicOpenPointResponseDto getByIdForAdmin(Long id) {
        PublicOpenPoint op = openPointRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Open point not found"));
        List<OpenPointAttachment> attachments = attachmentRepository.findByOpenPointIdOrderByDisplayOrderAsc(id);
        return mapToResponse(op, attachments);
    }

    @Transactional
    public PublicOpenPointResponseDto updateStatusAndPriority(Long id,
                                                              OpenPointStatus status,
                                                              OpenPointPriority priority,
                                                              String internalNotes) {
        PublicOpenPoint op = openPointRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Open point not found"));

        if (status != null) {
            op.setStatus(status);
        }
        if (priority != null) {
            op.setPriority(priority);
        }
        if (internalNotes != null) {
            op.setInternalNotes(internalNotes);
        }

        op = openPointRepository.save(op);

        // Optionally notify reporter if we have email/mobile
        // (could be integrated with email/SMS service later)

        List<OpenPointAttachment> attachments = attachmentRepository.findByOpenPointIdOrderByDisplayOrderAsc(id);
        return mapToResponse(op, attachments);
    }

    private PublicOpenPointResponseDto mapToResponse(PublicOpenPoint op, List<OpenPointAttachment> attachments) {
        List<SimpleAttachmentDto> attachmentDtos = attachments == null ? Collections.emptyList()
                : attachments.stream()
                .map(a -> SimpleAttachmentDto.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .attachmentType(a.getAttachmentType())
                        .fileSize(a.getFileSize())
                        .build())
                .collect(Collectors.toList());

        return PublicOpenPointResponseDto.builder()
                .id(op.getId())
                .type(op.getType())
                .status(op.getStatus())
                .priority(op.getPriority())
                .title(op.getTitle())
                .description(op.getDescription())
                .impactArea(op.getImpactArea())
                .url(op.getUrl())
                .environment(op.getEnvironment())
                .clientInfo(op.getClientInfo())
                .reporterName(op.getReporterName())
                .reporterEmail(op.getReporterEmail())
                .reporterMobile(op.getReporterMobile())
                .reporterRole(op.getReporterRole())
                .createdAt(op.getCreatedAt())
                .attachments(attachmentDtos)
                .build();
    }

    /**
     * Store uploaded files on the server and return accessible URLs.
     * The physical path is configured via feedback.documents-path and files
     * are stored under documentsPath + /Feedback/docs/ as requested.
     */
    @Transactional
    public List<String> uploadFiles(org.springframework.web.multipart.MultipartFile[] files) throws IOException {
        if (files == null || files.length == 0) {
            return Collections.emptyList();
        }

        Path baseDir = Paths.get(feedbackDocumentsPath).toAbsolutePath().normalize();
        if (!Files.exists(baseDir)) {
            Files.createDirectories(baseDir);
        }

        List<String> urls = 
            java.util.Arrays.stream(files)
                .filter(f -> f != null && !f.isEmpty())
                .map(file -> {
                    String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
                    String extension = "";
                    int dotIndex = originalFilename.lastIndexOf('.');
                    if (dotIndex != -1) {
                        extension = originalFilename.substring(dotIndex);
                    }
                    String storedName = UUID.randomUUID() + extension;
                    Path target = baseDir.resolve(storedName);
                    try {
                        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                        // Expose via public controller GET /public/open-points/files/{filename}
                        return "/public/open-points/files/" + storedName;
                    } catch (IOException e) {
                        log.error("Failed to store feedback attachment {}", originalFilename, e);
                        throw new RuntimeException("Could not store file " + originalFilename, e);
                    }
                })
                .collect(Collectors.toList());

        return urls;
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(String filename) {
        try {
            Path baseDir = Paths.get(feedbackDocumentsPath).toAbsolutePath().normalize();
            Path filePath = baseDir.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + filename);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found: " + filename, ex);
        }
    }
}

