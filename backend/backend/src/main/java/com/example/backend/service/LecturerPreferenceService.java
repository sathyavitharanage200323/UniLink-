package com.example.backend.service;

import com.example.backend.dto.LecturerPreferenceRequest;
import com.example.backend.model.LecturerPreference;
import com.example.backend.repository.LecturerPreferenceRepository;
import org.springframework.stereotype.Service;

@Service
public class LecturerPreferenceService {

    private final LecturerPreferenceRepository preferenceRepository;

    public LecturerPreferenceService(LecturerPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    public LecturerPreference getOrCreatePreference(Long lecturerId) {
        return preferenceRepository.findByLecturerId(lecturerId)
                .orElseGet(() -> {
                    LecturerPreference pref = new LecturerPreference();
                    pref.setLecturerId(lecturerId);
                    return preferenceRepository.save(pref);
                });
    }

    public LecturerPreference saveOrUpdate(LecturerPreferenceRequest request) {
        LecturerPreference pref = preferenceRepository.findByLecturerId(request.getLecturerId())
                .orElse(new LecturerPreference());

        pref.setLecturerId(request.getLecturerId());
        pref.setSlotDuration(request.getSlotDuration());
        pref.setBreakTime(request.getBreakTime());
        pref.setWorkStartTime(request.getWorkStartTime());
        pref.setWorkEndTime(request.getWorkEndTime());
        pref.setMaxSlotsPerDay(request.getMaxSlotsPerDay());
        pref.setPreferredMode(request.getPreferredMode());

        validatePreferences(pref);

        return preferenceRepository.save(pref);
    }

    private void validatePreferences(LecturerPreference pref) {
        if (pref.getSlotDuration() == null || pref.getSlotDuration() <= 0) {
            throw new RuntimeException("Slot duration must be greater than 0");
        }

        if (pref.getBreakTime() == null || pref.getBreakTime() < 0) {
            throw new RuntimeException("Break time cannot be negative");
        }

        if (pref.getWorkStartTime() == null || pref.getWorkEndTime() == null) {
            throw new RuntimeException("Working hours are required");
        }

        if (!pref.getWorkEndTime().isAfter(pref.getWorkStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        if (pref.getMaxSlotsPerDay() == null || pref.getMaxSlotsPerDay() <= 0) {
            throw new RuntimeException("Max slots per day must be greater than 0");
        }

        if (pref.getPreferredMode() == null || pref.getPreferredMode().isBlank()) {
            pref.setPreferredMode("BOTH");
        }
    }
}