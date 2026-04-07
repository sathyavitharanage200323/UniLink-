package com.example.backend.repository;

import com.example.backend.model.AvailabilitySlot;
import com.example.backend.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    
    List<AvailabilitySlot> findByLecturerOrderBySlotDateAscStartTimeAsc(User lecturer);

    List<AvailabilitySlot> findByLecturerAndStatusOrderBySlotDateAscStartTimeAsc(User lecturer, AvailabilitySlot.SlotStatus status);

    Optional<AvailabilitySlot> findByLecturerAndSlotDateAndStartTimeAndEndTime(
            User lecturer,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s FROM AvailabilitySlot s
            WHERE s.lecturer = :lecturer
              AND s.slotDate = :slotDate
              AND s.startTime = :startTime
              AND s.endTime = :endTime
            """)
    Optional<AvailabilitySlot> findForUpdateByLecturerAndSlotDateAndStartTimeAndEndTime(
            @Param("lecturer") User lecturer,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
    
    @Modifying
    @Query("DELETE FROM AvailabilitySlot a WHERE a.lecturer = ?1")
    void deleteByLecturer(User lecturer);

        @Modifying
        @Query("DELETE FROM AvailabilitySlot a WHERE a.lecturer.id = :lecturerId")
        void deleteByLecturerId(@Param("lecturerId") Long lecturerId);
}
