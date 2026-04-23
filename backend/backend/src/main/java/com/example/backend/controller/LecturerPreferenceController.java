package com.example.backend.controller;

import com.example.backend.dto.LecturerPreferenceRequest;
import com.example.backend.model.LecturerPreference;
import com.example.backend.service.LecturerPreferenceService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
@CrossOrigin(origins = "http://localhost:3000")
public class LecturerPreferenceController {

    private final LecturerPreferenceService preferenceService;

    public LecturerPreferenceController(LecturerPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping("/{lecturerId}")
    public LecturerPreference getPreference(@PathVariable Long lecturerId) {
        return preferenceService.getOrCreatePreference(lecturerId);
    }

    @PostMapping
    public LecturerPreference savePreference(@RequestBody LecturerPreferenceRequest request) {
        return preferenceService.saveOrUpdate(request);
    }
}