package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.StudentDiscipline;
import com.example.backend.model.User;
import com.example.backend.repository.StudentDisciplineRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DisciplineService {

    private final StudentDisciplineRepository disciplineRepository;
    private final UserRepository userRepository;

    public List<StudentDiscipline> getDisciplineRecords(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", studentId));
        return disciplineRepository.findByStudent(student);
    }

    @Transactional
    public StudentDiscipline applyDiscipline(Long lecturerId, Long studentId,
                                             StudentDiscipline.DisciplineType type,
                                             String reason, LocalDateTime expiresAt) {
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", lecturerId));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", studentId));

        StudentDiscipline record = StudentDiscipline.builder()
                .lecturer(lecturer)
                .student(student)
                .type(type)
                .reason(reason)
                .expiresAt(expiresAt)
                .active(true)
                .build();
        return disciplineRepository.save(record);
    }

    @Transactional
    public void revokeBlock(Long disciplineId) {
        StudentDiscipline record = disciplineRepository.findById(disciplineId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentDiscipline", disciplineId));
        record.setActive(false);
        disciplineRepository.save(record);
    }

    public boolean isBlocked(Long studentId, Long lecturerId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", studentId));
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", lecturerId));
        return disciplineRepository.isStudentBlockedByLecturer(student, lecturer, LocalDateTime.now());
    }
}
