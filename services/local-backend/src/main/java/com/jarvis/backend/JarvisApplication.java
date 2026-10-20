package com.jarvis.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JarvisApplication {
    public static void main(String[] args) {
        java.io.File jarvisDir = new java.io.File(System.getProperty("user.home"), ".jarvis");
        if (!jarvisDir.exists()) {
            jarvisDir.mkdirs();
        }
        SpringApplication.run(JarvisApplication.class, args);
    }
}
