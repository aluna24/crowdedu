
-- Clear existing classes and reservations to reseed schedule
DELETE FROM class_reservations;
DELETE FROM fitness_classes;

-- Weekday classes (5/day)
INSERT INTO fitness_classes (name, instructor, day, time, location, max_spots, category) VALUES
-- Monday
('Sunrise Yoga', 'Emma Chen', 'Monday', '6:30 AM', 'Multipurpose Room', 20, 'Yoga'),
('HIIT Express', 'Marcus Lee', 'Monday', '12:00 PM', '3M', 18, 'Cardio'),
('Cycle Power', 'Sofia Ramirez', 'Monday', '4:30 PM', 'Multipurpose Room', 22, 'Cardio'),
('Strength Lab', 'Jordan Pierce', 'Monday', '5:30 PM', 'Fitness Center', 15, 'Strength'),
('Pilates Core', 'Amelia Park', 'Monday', '7:00 PM', 'Multipurpose Room', 20, 'Mind-Body'),
-- Tuesday
('Sunrise Yoga', 'Emma Chen', 'Tuesday', '6:30 AM', 'Multipurpose Room', 20, 'Yoga'),
('HIIT Express', 'Marcus Lee', 'Tuesday', '12:00 PM', '3M', 18, 'Cardio'),
('Cycle Power', 'Sofia Ramirez', 'Tuesday', '4:30 PM', 'Multipurpose Room', 22, 'Cardio'),
('Strength Lab', 'Jordan Pierce', 'Tuesday', '5:30 PM', 'Fitness Center', 15, 'Strength'),
('Zumba Night', 'Lia Fernandes', 'Tuesday', '7:00 PM', 'Multipurpose Room', 25, 'Dance'),
-- Wednesday
('Sunrise Yoga', 'Emma Chen', 'Wednesday', '6:30 AM', 'Multipurpose Room', 20, 'Yoga'),
('HIIT Express', 'Marcus Lee', 'Wednesday', '12:00 PM', '3M', 18, 'Cardio'),
('Cycle Power', 'Sofia Ramirez', 'Wednesday', '4:30 PM', 'Multipurpose Room', 22, 'Cardio'),
('Strength Lab', 'Jordan Pierce', 'Wednesday', '5:30 PM', 'Fitness Center', 15, 'Strength'),
('Bootcamp', 'Devon Hayes', 'Wednesday', '7:00 PM', '3M', 20, 'Strength'),
-- Thursday
('Sunrise Yoga', 'Emma Chen', 'Thursday', '6:30 AM', 'Multipurpose Room', 20, 'Yoga'),
('HIIT Express', 'Marcus Lee', 'Thursday', '12:00 PM', '3M', 18, 'Cardio'),
('Cycle Power', 'Sofia Ramirez', 'Thursday', '4:30 PM', 'Multipurpose Room', 22, 'Cardio'),
('Strength Lab', 'Jordan Pierce', 'Thursday', '5:30 PM', 'Fitness Center', 15, 'Strength'),
('Barre Burn', 'Amelia Park', 'Thursday', '7:00 PM', 'Multipurpose Room', 20, 'Mind-Body'),
-- Friday
('Sunrise Yoga', 'Emma Chen', 'Friday', '6:30 AM', 'Multipurpose Room', 20, 'Yoga'),
('HIIT Express', 'Marcus Lee', 'Friday', '12:00 PM', '3M', 18, 'Cardio'),
('Cycle Power', 'Sofia Ramirez', 'Friday', '4:30 PM', 'Multipurpose Room', 22, 'Cardio'),
('Strength Lab', 'Jordan Pierce', 'Friday', '5:30 PM', 'Fitness Center', 15, 'Strength'),
('Core & More', 'Amelia Park', 'Friday', '7:00 PM', 'Multipurpose Room', 20, 'Mind-Body'),
-- Saturday (3)
('Yoga Flow', 'Emma Chen', 'Saturday', '9:00 AM', 'Multipurpose Room', 22, 'Yoga'),
('Cycle Endurance', 'Sofia Ramirez', 'Saturday', '10:30 AM', 'Multipurpose Room', 22, 'Cardio'),
('Total Body', 'Jordan Pierce', 'Saturday', '12:00 PM', 'Fitness Center', 18, 'Strength'),
-- Sunday (3)
('Yoga Flow', 'Emma Chen', 'Sunday', '9:00 AM', 'Multipurpose Room', 22, 'Yoga'),
('Cycle Endurance', 'Sofia Ramirez', 'Sunday', '10:30 AM', 'Multipurpose Room', 22, 'Cardio'),
('Dance Fitness', 'Lia Fernandes', 'Sunday', '12:00 PM', 'Multipurpose Room', 25, 'Dance');
