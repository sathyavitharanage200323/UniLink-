package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.CannedResponse;
import com.example.backend.model.User;
import com.example.backend.repository.CannedResponseRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CannedResponseService {

    private final CannedResponseRepository cannedResponseRepository;
    private final UserRepository userRepository;

    public List<CannedResponse> getByLecturer(Long lecturerId) {
        return cannedResponseRepository.findByLecturerId(lecturerId);
    }

    @Transactional
    public CannedResponse create(Long lecturerId, String title, String content) {
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", lecturerId));
        CannedResponse cr = CannedResponse.builder()
                .lecturer(lecturer)
                .title(title)
                .content(content)
                .build();
        return cannedResponseRepository.save(cr);
    }

    @Transactional
    public CannedResponse update(Long id, String title, String content) {
        CannedResponse cr = cannedResponseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CannedResponse", id));
        cr.setTitle(title);
        cr.setContent(content);
        return cannedResponseRepository.save(cr);
    }

    @Transactional
    public void delete(Long id) {
        if (!cannedResponseRepository.existsById(id)) {
            throw new ResourceNotFoundException("CannedResponse", id);
        }
        cannedResponseRepository.deleteById(id);
    }
}
