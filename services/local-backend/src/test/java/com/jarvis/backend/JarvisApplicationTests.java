package com.jarvis.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "jarvis.startup-token=test-token",
    "spring.datasource.url=jdbc:sqlite:file::memory:?cache=shared",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class JarvisApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring context starts successfully
    }
}
