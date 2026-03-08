package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for user management and DND toggle.
 * Base URL: /api/users
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable User.Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.save(user));
    }

    /**
     * Toggle Do Not Disturb for a lecturer.
     * Body: { dnd: true/false, autoReplyMessage: "..." }
     */
    @PatchMapping("/{id}/dnd")
    public ResponseEntity<User> toggleDnd(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        boolean dnd = Boolean.parseBoolean(body.get("dnd").toString());
        String msg = body.containsKey("autoReplyMessage")
                ? body.get("autoReplyMessage").toString() : null;
        return ResponseEntity.ok(userService.toggleDoNotDisturb(id, dnd, msg));
    }
}
