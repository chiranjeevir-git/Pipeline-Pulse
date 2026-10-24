package com.pipeline.pulse.repository;

import com.pipeline.pulse.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, String> {
}
