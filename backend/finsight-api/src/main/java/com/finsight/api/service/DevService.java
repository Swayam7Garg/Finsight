package com.finsight.api.service;

import com.finsight.api.repository.CategoryRepository;
import com.finsight.common.model.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DevService {

    private final CategoryRepository categoryRepository;

    public void seedCategories() {
        if (categoryRepository.count() > 0) return;

        List<Category> categories = List.of(
            Category.builder().name("Salary").icon("Briefcase").color("#10b981").type("income").isDefault(true).build(),
            Category.builder().name("Freelance").icon("DollarSign").color("#3b82f6").type("income").isDefault(true).build(),
            Category.builder().name("Food & Dining").icon("Utensils").color("#f59e0b").type("expense").isDefault(true).build(),
            Category.builder().name("Transport").icon("Car").color("#6366f1").type("expense").isDefault(true).build(),
            Category.builder().name("Housing").icon("Home").color("#475569").type("expense").isDefault(true).build(),
            Category.builder().name("Entertainment").icon("Film").color("#ec4899").type("expense").isDefault(true).build(),
            Category.builder().name("Shopping").icon("ShoppingBag").color("#a855f7").type("expense").isDefault(true).build(),
            Category.builder().name("Utilities").icon("Zap").color("#06b6d4").type("expense").isDefault(true).build(),
            Category.builder().name("Insurance").icon("ShieldCheck").color("#ef4444").type("expense").isDefault(true).build(),
            Category.builder().name("Medical").icon("HeartPulse").color("#f43f5e").type("expense").isDefault(true).build()
        );

        categoryRepository.saveAll(categories);
    }
}
