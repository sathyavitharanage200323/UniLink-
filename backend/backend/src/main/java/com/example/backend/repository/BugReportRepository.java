package com.example.backend.repository;

import com.example.backend.model.BugReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BugReportRepository extends JpaRepository<BugReport, Long> {
    List<BugReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
    List<BugReport> findAllByOrderByCreatedAtDesc();
    List<BugReport> findByReporterIdAndStatusAndReporterNotifiedFalse(Long reporterId, BugReport.Status status);

    @Modifying
    @Query("DELETE FROM BugReport b WHERE b.reporter.id = :userId OR b.fixedBy.id = :userId")
    void deleteByReporterOrFixedBy(@Param("userId") Long userId);
}
