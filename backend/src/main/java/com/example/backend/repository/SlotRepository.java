package com.example.backend.repository;

import com.example.backend.model.Slot;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByLecturer(User lecturer);
}
