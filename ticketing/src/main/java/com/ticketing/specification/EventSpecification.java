package com.ticketing.specification;

import com.ticketing.entity.*;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class EventSpecification {

    private EventSpecification() {}

    public static Specification<Event> withFilters(
            String title,
            List<Long> tagIds,
            List<String> ratings,
            List<Long> venueIds,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            OffsetDateTime startDate,
            OffsetDateTime endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Base: only events that have at least one showtime
            Subquery<Integer> hasShowtime = query.subquery(Integer.class);
            Root<Showtime> hsRoot = hasShowtime.from(Showtime.class);
            hasShowtime.select(cb.literal(1)).where(cb.equal(hsRoot.get("event"), root));
            predicates.add(cb.exists(hasShowtime));

            // Title: case-insensitive partial match
            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")),
                        "%" + title.trim().toLowerCase() + "%"));
            }

            // Tags: event has at least one of the given tags (OR logic)
            if (tagIds != null && !tagIds.isEmpty()) {
                Subquery<Integer> tagSub = query.subquery(Integer.class);
                Root<Event> tagRoot = tagSub.correlate(root);
                Join<Event, EventType> tagJoin = tagRoot.join("tags");
                tagSub.select(cb.literal(1)).where(tagJoin.get("typeId").in(tagIds));
                predicates.add(cb.exists(tagSub));
            }

            // Age rating: event rating is one of the selected values
            if (ratings != null && !ratings.isEmpty()) {
                predicates.add(root.get("rating").in(ratings));
            }

            // Venue: event has at least one showtime at any selected venue
            if (venueIds != null && !venueIds.isEmpty()) {
                Subquery<Integer> venueSub = query.subquery(Integer.class);
                Root<Showtime> vsRoot = venueSub.from(Showtime.class);
                venueSub.select(cb.literal(1)).where(
                        cb.equal(vsRoot.get("event"), root),
                        vsRoot.get("venue").get("venueId").in(venueIds));
                predicates.add(cb.exists(venueSub));
            }

            // Price: event has a showtime with a tier within the price range
            if (minPrice != null || maxPrice != null) {
                Subquery<Integer> priceSub = query.subquery(Integer.class);
                Root<Showtime> psRoot = priceSub.from(Showtime.class);
                Join<Showtime, TicketTier> tier = psRoot.join("tiers");
                List<Predicate> pp = new ArrayList<>();
                pp.add(cb.equal(psRoot.get("event"), root));
                if (minPrice != null) pp.add(cb.ge(tier.get("price"), minPrice));
                if (maxPrice != null) pp.add(cb.le(tier.get("price"), maxPrice));
                priceSub.select(cb.literal(1)).where(pp.toArray(new Predicate[0]));
                predicates.add(cb.exists(priceSub));
            }

            // Date: event has a showtime within the date range
            if (startDate != null || endDate != null) {
                Subquery<Integer> dateSub = query.subquery(Integer.class);
                Root<Showtime> dsRoot = dateSub.from(Showtime.class);
                List<Predicate> dp = new ArrayList<>();
                dp.add(cb.equal(dsRoot.get("event"), root));
                if (startDate != null) dp.add(cb.greaterThanOrEqualTo(dsRoot.get("showSchedules"), startDate));
                if (endDate != null) dp.add(cb.lessThanOrEqualTo(dsRoot.get("showSchedules"), endDate));
                dateSub.select(cb.literal(1)).where(dp.toArray(new Predicate[0]));
                predicates.add(cb.exists(dateSub));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
