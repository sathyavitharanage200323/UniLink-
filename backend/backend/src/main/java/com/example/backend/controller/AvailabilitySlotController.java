package com.example.backend.controller;

import com.example.backend.model.AvailabilitySlot;
import com.example.backend.service.AvailabilitySlotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3003", "http://localhost:3006"})
public class AvailabilitySlotController {

    private final AvailabilitySlotService service;

    public AvailabilitySlotController(AvailabilitySlotService service) {
        this.service = service;
    }

    @GetMapping("/lecturer/{lecturerId}")
    public List<AvailabilitySlot> getSlotsByLecturer(@PathVariable Long lecturerId) {
        return service.getSlotsByLecturer(lecturerId);
    }

    @PostMapping
    public AvailabilitySlot createSlot(@RequestBody AvailabilitySlot slot) {
        return service.createSlot(slot);
    }

    @PutMapping("/{id}")
    public AvailabilitySlot updateSlot(@PathVariable Long id, @RequestBody AvailabilitySlot slot) {
        return service.updateSlot(id, slot);
    }

    @DeleteMapping("/{id}")
    public void deleteSlot(@PathVariable Long id) {
        service.deleteSlot(id);
    }
}