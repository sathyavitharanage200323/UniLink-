package com.example.backend.repository;

import com.example.backend.model.AvailabilitySlot;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    
    List<AvailabilitySlot> findByLecturerOrderBySlotDateAscStartTimeAsc(User lecturer);

    List<AvailabilitySlot> findByLecturerAndStatusOrderBySlotDateAscStartTimeAsc(User lecturer, AvailabilitySlot.SlotStatus status);
    
    @Modifying
    @Query("DELETE FROM AvailabilitySlot a WHERE a.lecturer = ?1")
    void deleteByLecturer(User lecturer);
}
