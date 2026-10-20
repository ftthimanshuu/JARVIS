package com.jarvis.backend.persistence;

import com.jarvis.backend.domain.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, String> {
    Optional<OAuthAccount> findByProvider(String provider);
}
