package kz.car.maintenance.repository;

import kz.car.maintenance.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    @Query(value = """
            SELECT *
            FROM users u
            WHERE u.id <> :currentUserId
              AND u.status = 'ACTIVE'
            ORDER BY md5(concat(cast(u.id as text), '-', cast(:currentUserId as text)))
            """, countQuery = """
            SELECT COUNT(*)
            FROM users u
            WHERE u.id <> :currentUserId
              AND u.status = 'ACTIVE'
            """, nativeQuery = true)
    Page<User> findRandomActiveChatContacts(@Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("""
            SELECT u
            FROM User u
            WHERE u.id <> :currentUserId
              AND u.status = :status
              AND (
                    lower(u.firstName) LIKE lower(concat('%', :query, '%'))
                 OR lower(u.lastName) LIKE lower(concat('%', :query, '%'))
                 OR lower(concat(coalesce(u.firstName, ''), ' ', coalesce(u.lastName, ''))) LIKE lower(concat('%', :query, '%'))
                 OR lower(u.email) LIKE lower(concat('%', :query, '%'))
              )
            ORDER BY u.firstName ASC, u.lastName ASC, u.id ASC
            """)
    Page<User> searchActiveChatContacts(
            @Param("currentUserId") Long currentUserId,
            @Param("status") User.UserStatus status,
            @Param("query") String query,
            Pageable pageable
    );
}
