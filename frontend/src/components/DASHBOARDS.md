# Donezo Style Dashboards

This directory contains modern, responsive dashboards designed with the Donezo style:

## Color Palette
- Primary Color: Teal (#0d9488)
- Secondary Colors: Blue, Green, Yellow for status indicators
- Clean, minimalist design with rounded corners and subtle shadows

## Features

### Patient Dashboard
- 4 statistics cards: Upcoming appointments, Past appointments, Doctors, Messages
- Calendar view with appointment markers
- Today's medications with "Taken" buttons
- Health articles section
- Activity charts (bar chart for appointments, pie chart for medication adherence)

### Doctor Dashboard
- 4 statistics cards: Patients, Today's appointments, Articles, Pending requests
- Today's agenda with appointment list
- Today's patients with last visit information
- Appointment request management
- Patient statistics charts (line chart for patient evolution, pie chart for appointment stats)

### Admin Dashboard
- 4 statistics cards: Users, Appointments, Pending articles, Active today
- System alerts with different severity levels
- User distribution pie chart
- Recent activity feed
- System status indicators
- Registration statistics (area chart)
- Appointment statistics (bar chart)

## Technology Stack
- React with functional components and hooks
- Tailwind CSS for styling
- Recharts for data visualization
- Responsive design for all screen sizes
- React Icons for consistent iconography

## Responsive Design
All dashboards are fully responsive and adapt to:
- Desktop (2-column layout)
- Tablet (1-column layout with adjusted spacing)
- Mobile (Stacked cards with touch-friendly elements)

## Implementation Notes
- Each dashboard is contained in its own component file
- Shared styles are in DashboardLayout.css
- Mock data is used for demonstration purposes
- Real API integration can be added by replacing mock data with actual API calls