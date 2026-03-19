package com.finsight.api.service;

import com.finsight.api.repository.GoalRepository;
import com.finsight.common.dto.goal.GoalResponse;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.Goal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public List<GoalResponse> list(String userId) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    public GoalResponse getById(String userId, String goalId) {
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> ApiException.notFound("Goal not found"));
        return toResponse(goal);
    }

    public GoalResponse create(String userId, String name, double targetAmount,
                                Double currentAmount, String deadline,
                                String color, String icon) {
        Goal goal = Goal.builder()
                .userId(userId)
                .name(name)
                .targetAmount(targetAmount)
                .currentAmount(currentAmount != null ? currentAmount : 0)
                .deadline(deadline != null ? Instant.parse(deadline) : null)
                .color(color != null ? color : "#10b981")
                .icon(icon != null ? icon : "\uD83C\uDFAF")
                .build();
        return toResponse(goalRepository.save(goal));
    }

    public GoalResponse update(String userId, String goalId,
                                String name, Double targetAmount, Double currentAmount,
                                String deadline, String color, String icon, Boolean isCompleted) {
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> ApiException.notFound("Goal not found"));

        if (name != null) goal.setName(name);
        if (targetAmount != null) goal.setTargetAmount(targetAmount);
        if (currentAmount != null) goal.setCurrentAmount(currentAmount);
        if (deadline != null) goal.setDeadline(deadline.isEmpty() ? null : Instant.parse(deadline));
        if (color != null) goal.setColor(color);
        if (icon != null) goal.setIcon(icon);
        if (isCompleted != null) goal.setCompleted(isCompleted);

        return toResponse(goalRepository.save(goal));
    }

    public GoalResponse delete(String userId, String goalId) {
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> ApiException.notFound("Goal not found"));
        goalRepository.delete(goal);
        return toResponse(goal);
    }

    public GoalResponse addFunds(String userId, String goalId, double amount) {
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> ApiException.notFound("Goal not found"));

        if (goal.isCompleted()) {
            throw ApiException.badRequest("This goal is already completed");
        }

        goal.setCurrentAmount(goal.getCurrentAmount() + amount);
        if (goal.getCurrentAmount() >= goal.getTargetAmount()) {
            goal.setCompleted(true);
        }

        return toResponse(goalRepository.save(goal));
    }

    private GoalResponse toResponse(Goal goal) {
        return GoalResponse.builder()
                .id(goal.getId())
                .userId(goal.getUserId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .deadline(goal.getDeadline() != null ? goal.getDeadline().toString() : null)
                .color(goal.getColor())
                .icon(goal.getIcon())
                .isCompleted(goal.isCompleted())
                .createdAt(goal.getCreatedAt() != null ? goal.getCreatedAt().toString() : null)
                .updatedAt(goal.getUpdatedAt() != null ? goal.getUpdatedAt().toString() : null)
                .build();
    }
}
