package com.ticketing.service.impl;

import com.ticketing.dto.event.TagDto;
import com.ticketing.repository.EventTypeRepository;
import com.ticketing.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final EventTypeRepository eventTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TagDto> getAll() {
        return eventTypeRepository.findAll().stream()
                .sorted((a, b) -> a.getTypeName().compareToIgnoreCase(b.getTypeName()))
                .map(t -> new TagDto(t.getTypeId(), t.getTypeName()))
                .toList();
    }
}
