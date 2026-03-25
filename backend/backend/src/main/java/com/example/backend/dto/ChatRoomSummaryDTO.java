package com.example.backend.dto;

import com.example.backend.model.ChatRoom;
import com.example.backend.model.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRoomSummaryDTO {
    private Long roomId;
    private String roomStatus;
    private String roomType;
    private Long appointmentId;

    private Long studentId;
    private String studentName;
    private String studentDepartment;

    private Long lecturerId;
    private String lecturerName;
    private String lecturerDepartment;
    private String lecturerDesignation;

    public static ChatRoomSummaryDTO from(ChatRoom room, String lecturerDesignation) {
        final boolean isAppointment = room.getAppointment() != null;
        final User student = isAppointment ? room.getAppointment().getStudent() : room.getParticipantStudent();
        final User lecturer = isAppointment ? room.getAppointment().getLecturer() : room.getParticipantLecturer();

        return ChatRoomSummaryDTO.builder()
                .roomId(room.getId())
                .roomStatus(room.getStatus().name())
                .roomType(isAppointment ? "APPOINTMENT" : "DIRECT")
                .appointmentId(isAppointment ? room.getAppointment().getId() : null)
                .studentId(student != null ? student.getId() : null)
                .studentName(student != null ? student.getName() : null)
                .studentDepartment(student != null ? student.getDepartment() : null)
                .lecturerId(lecturer != null ? lecturer.getId() : null)
                .lecturerName(lecturer != null ? lecturer.getName() : null)
                .lecturerDepartment(lecturer != null ? lecturer.getDepartment() : null)
                .lecturerDesignation(lecturerDesignation)
                .build();
    }
}
