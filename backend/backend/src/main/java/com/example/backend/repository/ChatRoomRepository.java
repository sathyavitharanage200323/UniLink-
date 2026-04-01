package com.example.backend.repository;

import com.example.backend.model.Appointment;
import com.example.backend.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByAppointment(Appointment appointment);
    Optional<ChatRoom> findByAppointmentId(Long appointmentId);
}
