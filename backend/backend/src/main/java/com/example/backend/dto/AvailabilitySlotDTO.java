package com.example.backend.dto;

import com.example.backend.model.AvailabilitySlot;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilitySlotDTO {
    private Long id;
    private String slotDate;
    private String startTime;
    private String endTime;
    private String status;
    private String mode;
    private String location;
    private String meetingLink;
    private String blockReason;

    public static AvailabilitySlotDTO from(AvailabilitySlot slot) {
        return AvailabilitySlotDTO.builder()
                .id(slot.getId())
                .slotDate(slot.getSlotDate() != null ? slot.getSlotDate().toString() : "")
                .startTime(slot.getStartTime() != null ? slot.getStartTime().toString() : "")
                .endTime(slot.getEndTime() != null ? slot.getEndTime().toString() : "")
                .status(slot.getStatus() != null ? slot.getStatus().name() : "")
                .mode(slot.getMode())
                .location(slot.getLocation())
                .meetingLink(slot.getMeetingLink())
                .blockReason(slot.getBlockReason())
                .build();
    }
}
