package com.example.backend.repository;

import com.example.backend.model.User;
import com.example.backend.model.WaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, Long> {

    List<WaitlistEntry> findByLecturerAndSlotDateAndStartTimeAndEndTimeAndStatusOrderByCreatedAtAsc(
            User lecturer,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            WaitlistEntry.Status status
    );

    Optional<WaitlistEntry> findFirstByStudentAndLecturerAndSlotDateAndStartTimeAndEndTimeAndStatus(
            User student,
            User lecturer,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            WaitlistEntry.Status status
    );

    @Modifying
    @Query("""
           UPDATE WaitlistEntry w
              SET w.status = :nextStatus
            WHERE w.student = :student
              AND w.lecturer = :lecturer
              AND w.slotDate = :slotDate
              AND w.startTime = :startTime
              AND w.endTime = :endTime
              AND w.status = :currentStatus
           """)
    int updateStatusForStudentAndSlot(
            @Param("student") User student,
            @Param("lecturer") User lecturer,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("currentStatus") WaitlistEntry.Status currentStatus,
            @Param("nextStatus") WaitlistEntry.Status nextStatus
    );
}
