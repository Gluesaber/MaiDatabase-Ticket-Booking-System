package com.ticketing.service;

import com.ticketing.dto.event.TagDto;

import java.util.List;

public interface TagService {
    List<TagDto> getAll();
}
