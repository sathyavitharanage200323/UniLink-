package com.example.backend.controller;

import com.example.backend.model.Slot;
import com.example.backend.model.User;
import com.example.backend.repository.SlotRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotRepository slotRepository;
    private final UserRepository userRepository;

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<Slot>> getSlots(@PathVariable Long lecturerId) {
        User lecturer = userRepository.findById(lecturerId).orElseThrow();
        return ResponseEntity.ok(slotRepository.findByLecturer(lecturer));
    }
}
