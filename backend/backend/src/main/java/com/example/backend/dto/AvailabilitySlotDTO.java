package com.example.backend.dto;

import com.example.backend.model.AvailabilitySlot;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilitySlotDTO {
    private Long id;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private boolean available;

    public static AvailabilitySlotDTO from(AvailabilitySlot slot) {
        return AvailabilitySlotDTO.builder()
                .id(slot.getId())
                .dayOfWeek(slot.getDayOfWeek().name())
                .startTime(slot.getStartTime().toString())
                .endTime(slot.getEndTime().toString())
                .available(slot.isAvailable())
                .build();
    }
}
