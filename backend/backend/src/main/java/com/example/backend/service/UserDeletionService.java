package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.AvailabilitySlotRepository;
import com.example.backend.repository.CannedResponseRepository;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.example.backend.repository.LecturerProfileRepository;
import com.example.backend.repository.SlotRepository;
import com.example.backend.repository.StudentDisciplineRepository;
import com.example.backend.repository.StudentProfileRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final LecturerProfileRepository lecturerProfileRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final SlotRepository slotRepository;
    private final CannedResponseRepository cannedResponseRepository;
    private final StudentDisciplineRepository studentDisciplineRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public void deleteUserAndDependencies(User user) {
        if (user == null) {
            return;
        }

        Long userId = user.getId();

        List<Long> linkedRoomIds = chatRoomRepository.findAllLinkedRoomIds(userId);
        if (!linkedRoomIds.isEmpty()) {
            chatMessageRepository.deleteByRoomIds(linkedRoomIds);
            chatRoomRepository.deleteAllByRoomIds(linkedRoomIds);
        }

        chatMessageRepository.deleteBySenderId(userId);

        availabilitySlotRepository.deleteByLecturerId(userId);
        slotRepository.deleteByLecturerId(userId);
        cannedResponseRepository.deleteByLecturerId(userId);
        studentDisciplineRepository.deleteByUserId(userId);
        appointmentRepository.deleteByStudentId(userId);
        appointmentRepository.deleteByLecturerId(userId);

        studentProfileRepository.findById(userId).ifPresent(studentProfileRepository::delete);
        lecturerProfileRepository.findById(userId).ifPresent(lecturerProfileRepository::delete);

        userRepository.deleteById(userId);
    }
}
