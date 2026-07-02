CREATE INDEX `parts_part_number_idx` ON `parts` (`part_number`);--> statement-breakpoint
CREATE INDEX `parts_oem_number_idx` ON `parts` (`oem_number`);--> statement-breakpoint
CREATE INDEX `parts_name_ar_idx` ON `parts` (`name_ar`);--> statement-breakpoint
CREATE INDEX `parts_name_en_idx` ON `parts` (`name_en`);--> statement-breakpoint
CREATE INDEX `parts_brand_idx` ON `parts` (`brand`);--> statement-breakpoint
CREATE INDEX `parts_manufacturer_id_idx` ON `parts` (`manufacturer_id`);--> statement-breakpoint
CREATE INDEX `parts_category_id_idx` ON `parts` (`category_id`);--> statement-breakpoint
CREATE INDEX `inventory_store_id_idx` ON `inventory` (`store_id`);--> statement-breakpoint
CREATE INDEX `inventory_part_id_idx` ON `inventory` (`part_id`);--> statement-breakpoint
CREATE INDEX `inventory_price_idx` ON `inventory` (`price`);--> statement-breakpoint
CREATE INDEX `inventory_quantity_idx` ON `inventory` (`quantity`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_city_idx` ON `users` (`city`);--> statement-breakpoint
CREATE INDEX `vehicles_make_idx` ON `vehicles` (`make`);--> statement-breakpoint
CREATE INDEX `vehicles_model_idx` ON `vehicles` (`model`);--> statement-breakpoint
CREATE INDEX `vehicles_year_idx` ON `vehicles` (`year`);