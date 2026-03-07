package com.servichaya;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = "com.servichaya")
@EnableJpaAuditing
@EnableCaching
public class ServichayaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServichayaApplication.class, args);
    }
}
