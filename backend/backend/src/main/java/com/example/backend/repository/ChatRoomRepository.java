package com.example.backend.repository;

import com.example.backend.model.Appointment;
import com.example.backend.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByAppointment(Appointment appointment);
    Optional<ChatRoom> findByAppointmentId(Long appointmentId);

    @Query("SELECT r FROM ChatRoom r WHERE r.participantStudent.id = :studentId AND r.participantLecturer.id = :lecturerId ORDER BY r.id DESC")
    List<ChatRoom> findDirectRooms(@Param("studentId") Long studentId, @Param("lecturerId") Long lecturerId);

    @Query("SELECT r FROM ChatRoom r " +
            "LEFT JOIN FETCH r.appointment a " +
            "LEFT JOIN FETCH a.student " +
            "LEFT JOIN FETCH a.lecturer " +
            "LEFT JOIN FETCH r.participantStudent " +
            "LEFT JOIN FETCH r.participantLecturer " +
            "WHERE (a.student.id = :userId OR a.lecturer.id = :userId OR r.participantStudent.id = :userId OR r.participantLecturer.id = :userId)")
    List<ChatRoom> findAllByUserId(@Param("userId") Long userId);
}
