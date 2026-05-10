package com.ticketing.scheduler;

import com.ticketing.entity.enums.BookingStatus;
import com.ticketing.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpirationScheduler {

    private final BookingRepository bookingRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expirePendingBookings() {
        var expired = bookingRepository.findAllByStatusAndExpiresAtBefore(
                BookingStatus.PENDING, OffsetDateTime.now());

        if (expired.isEmpty()) return;

        expired.forEach(b -> b.expire());
        bookingRepository.saveAll(expired);

        log.info("Expired {} pending booking(s).", expired.size());
    }
}
