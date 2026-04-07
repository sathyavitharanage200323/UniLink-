package com.example.backend.repository;

import com.example.backend.model.Slot;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByLecturer(User lecturer);

    @Modifying
    @Query("DELETE FROM Slot s WHERE s.lecturer = ?1")
    void deleteByLecturer(User lecturer);

    @Modifying
    @Query("DELETE FROM Slot s WHERE s.lecturer.id = :lecturerId")
    void deleteByLecturerId(@Param("lecturerId") Long lecturerId);
}
