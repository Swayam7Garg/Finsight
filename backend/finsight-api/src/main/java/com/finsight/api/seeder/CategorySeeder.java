package com.finsight.api.seeder;

import com.finsight.api.repository.CategoryRepository;
import com.finsight.common.model.Category;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategorySeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            log.info("No categories found. Seeding default categories...");
            
            List<Category> defaultCategories = List.of(
                    Category.builder()
                            .name("Housing")
                            .type("expense")
                            .color("#EF4444")
                            .icon("home")
                            .isDefault(true)
                            .build(),
                    Category.builder()
                            .name("Transportation")
                            .type("expense")
                            .color("#F97316")
                            .icon("car")
                            .isDefault(true)
                            .build(),
                    Category.builder()
                            .name("Food & Dining")
                            .type("expense")
                            .color("#EAB308")
                            .icon("utensils")
                            .isDefault(true)
                            .build(),
                    Category.builder()
                            .name("Salary")
                            .type("income")
                            .color("#22C55E")
                            .icon("briefcase")
                            .isDefault(true)
                            .build(),
                    Category.builder()
                            .name("Investment")
                            .type("income")
                            .color("#3B82F6")
                            .icon("trending-up")
                            .isDefault(true)
                            .build()
            );

            categoryRepository.saveAll(defaultCategories);
            log.info("Successfully seeded {} default categories.", defaultCategories.size());
        } else {
            log.info("Categories already exist. Skipping seeding.");
        }
    }
}
