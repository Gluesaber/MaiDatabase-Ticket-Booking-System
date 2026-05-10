package com.ticketing.repository;

import com.ticketing.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {
    List<Event> findByTitleContainingIgnoreCase(String title);
    List<Event> findByCreatedBy_UserIdOrderByEventIdDesc(Long userId);
}
