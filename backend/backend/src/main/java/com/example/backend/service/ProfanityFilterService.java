package com.example.backend.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Simple profanity filter that detects and masks bad words with asterisks.
 * Add more words to the BANNED_WORDS list as needed.
 */
@Service
public class ProfanityFilterService {

    // Academic context – expand this list as required
    private static final List<String> BANNED_WORDS = List.of(
            "badword1", "badword2", "idiot", "stupid", "dumb", "fool"
    );

    /**
     * Returns a version of the text with profanity masked.
     * E.g. "you idiot" -> "you *****"
     */
    public String filter(String text) {
        if (text == null) return null;
        String result = text;
        for (String word : BANNED_WORDS) {
            String stars = "*".repeat(word.length());
            result = result.replaceAll("(?i)\\b" + Pattern.quote(word) + "\\b", stars);
        }
        return result;
    }

    /**
     * Returns true if the text contains any banned word.
     */
    public boolean containsProfanity(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return BANNED_WORDS.stream().anyMatch(lower::contains);
    }
}
