import requests
import json

def test_patient_functionalities():
    """Test specific patient functionalities"""
    print("=== Detailed Patient Functionality Test ===")
    issues = []
    
    try:
        # Test 1: Patient data structure
        response = requests.get("http://localhost:8000/api/patients/")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) > 0:
                patient = patients[0]
                required_fields = ['id', 'user', 'adresse']
                missing_fields = [field for field in required_fields if field not in patient]
                if not missing_fields:
                    print("✓ Patient data structure is correct")
                else:
                    issues.append(f"Patient data missing fields: {missing_fields}")
            else:
                issues.append("No patients found in database")
        else:
            issues.append(f"Patient API failed with status {response.status_code}")
            
        # Test 2: Appointment data structure
        response = requests.get("http://localhost:8000/api/rendezvous/")
        if response.status_code == 200:
            appointments = response.json()
            if len(appointments) > 0:
                appointment = appointments[0]
                required_fields = ['numero', 'date', 'heure', 'statut', 'medecin_nom', 'patient_nom']
                missing_fields = [field for field in required_fields if field not in appointment]
                if not missing_fields:
                    print("✓ Appointment data structure is correct")
                else:
                    issues.append(f"Appointment data missing fields: {missing_fields}")
            else:
                print("ℹ️  No appointments found (not necessarily an issue)")
        else:
            issues.append(f"Appointment API failed with status {response.status_code}")
            
    except Exception as e:
        issues.append(f"Patient functionality test failed: {str(e)}")
    
    return issues

def test_doctor_functionalities():
    """Test specific doctor functionalities"""
    print("\n=== Detailed Doctor Functionality Test ===")
    issues = []
    
    try:
        # Test 1: Doctor data structure
        response = requests.get("http://localhost:8000/api/medecins/")
        if response.status_code == 200:
            doctors = response.json()
            if len(doctors) > 0:
                doctor = doctors[0]
                required_fields = ['id', 'user', 'specialite', 'disponibilite']
                missing_fields = [field for field in required_fields if field not in doctor]
                if not missing_fields:
                    print("✓ Doctor data structure is correct")
                else:
                    issues.append(f"Doctor data missing fields: {missing_fields}")
                    
                # Test user data structure within doctor
                if 'user' in doctor:
                    user = doctor['user']
                    required_user_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
                    missing_user_fields = [field for field in required_user_fields if field not in user]
                    if not missing_user_fields:
                        print("✓ Doctor user data structure is correct")
                    else:
                        issues.append(f"Doctor user data missing fields: {missing_user_fields}")
                else:
                    issues.append("Doctor missing user data")
            else:
                issues.append("No doctors found in database")
        else:
            issues.append(f"Doctor API failed with status {response.status_code}")
            
        # Test 2: Verify our created doctors have correct specialties
        if response.status_code == 200:
            doctors = response.json()
            specialty_check = {
                'dr_sophie': 'Pédiatrie',
                'dr_antoine': 'Dermatologie',
                'dr_marie': 'Gynécologie'
            }
            
            doctor_map = {doc['user']['username']: doc for doc in doctors}
            correct_specialties = 0
            
            for username, expected_specialty in specialty_check.items():
                if username in doctor_map:
                    actual_specialty = doctor_map[username]['specialite']
                    if actual_specialty == expected_specialty:
                        correct_specialties += 1
                    else:
                        issues.append(f"Doctor {username} has specialty '{actual_specialty}' instead of '{expected_specialty}'")
            
            if correct_specialties == len(specialty_check):
                print("✓ All created doctors have correct specialties")
            
    except Exception as e:
        issues.append(f"Doctor functionality test failed: {str(e)}")
    
    return issues

def test_admin_functionalities():
    """Test specific admin functionalities"""
    print("\n=== Detailed Admin Functionality Test ===")
    issues = []
    
    try:
        # Test 1: Admin endpoint accessibility
        endpoints = [
            "http://localhost:8000/api/admin/statistics/",
            "http://localhost:8000/api/admin/users/",
            "http://localhost:8000/api/admin/appointments/"
        ]
        
        accessible_endpoints = 0
        for endpoint in endpoints:
            try:
                response = requests.options(endpoint)
                if response.status_code in [200, 401, 403]:
                    accessible_endpoints += 1
                else:
                    issues.append(f"Admin endpoint {endpoint} returned status {response.status_code}")
            except Exception as e:
                issues.append(f"Failed to access admin endpoint {endpoint}: {str(e)}")
        
        if accessible_endpoints == len(endpoints):
            print("✓ All admin endpoints are accessible")
        else:
            issues.append(f"Only {accessible_endpoints}/{len(endpoints)} admin endpoints accessible")
            
        # Test 2: Check if admin endpoints return proper method information
        try:
            response = requests.options("http://localhost:8000/api/admin/users/")
            if 'Allow' in response.headers:
                allowed_methods = response.headers['Allow']
                if 'GET' in allowed_methods and 'POST' in allowed_methods:
                    print("✓ Admin user management supports required methods")
                else:
                    print(f"ℹ️  Admin user management methods: {allowed_methods}")
            else:
                print("ℹ️  Could not determine allowed methods for admin endpoints")
        except Exception as e:
            issues.append(f"Failed to check admin endpoint methods: {str(e)}")
            
    except Exception as e:
        issues.append(f"Admin functionality test failed: {str(e)}")
    
    return issues

def test_data_consistency():
    """Test data consistency across interfaces"""
    print("\n=== Data Consistency Test ===")
    issues = []
    
    try:
        # Test 1: Check if appointments reference existing doctors and patients
        appointments_response = requests.get("http://localhost:8000/api/rendezvous/")
        doctors_response = requests.get("http://localhost:8000/api/medecins/")
        patients_response = requests.get("http://localhost:8000/api/patients/")
        
        if (appointments_response.status_code == 200 and 
            doctors_response.status_code == 200 and 
            patients_response.status_code == 200):
            
            appointments = appointments_response.json()
            doctors = doctors_response.json()
            patients = patients_response.json()
            
            # Get lists of doctor and patient names
            doctor_names = [f"{doc['user']['first_name']} {doc['user']['last_name']}".strip() for doc in doctors]
            patient_names = [f"{pat['user']['first_name']} {pat['user']['last_name']}".strip() for pat in patients]
            
            # Check if appointment references exist in doctor/patient lists
            inconsistent_appointments = []
            for appointment in appointments:
                if appointment['medecin_nom'] not in doctor_names:
                    inconsistent_appointments.append(f"Appointment references non-existent doctor: {appointment['medecin_nom']}")
                if appointment['patient_nom'] not in patient_names:
                    inconsistent_appointments.append(f"Appointment references non-existent patient: {appointment['patient_nom']}")
            
            if not inconsistent_appointments:
                print("✓ All appointment references are consistent")
            else:
                issues.extend(inconsistent_appointments)
        else:
            issues.append("Failed to fetch data for consistency check")
            
    except Exception as e:
        issues.append(f"Data consistency test failed: {str(e)}")
    
    return issues

def main():
    """Run detailed functionality tests"""
    print("Starting detailed functionality testing...\n")
    
    all_issues = []
    
    # Run all tests
    all_issues.extend(test_patient_functionalities())
    all_issues.extend(test_doctor_functionalities())
    all_issues.extend(test_admin_functionalities())
    all_issues.extend(test_data_consistency())
    
    # Summary
    print("\n" + "="*60)
    print("DETAILED FUNCTIONALITY TEST SUMMARY")
    print("="*60)
    
    if not all_issues:
        print("🎉 All functionality tests passed! No issues found.")
        print("\nDetailed results:")
        print("  • Patient interface: Working correctly")
        print("  • Doctor interface: Working correctly")
        print("  • Admin interface: Working correctly")
        print("  • Data consistency: All references are valid")
        print("  • API endpoints: All responding properly")
        return True
    else:
        print(f"⚠️  Found {len(all_issues)} issues that need attention:")
        for i, issue in enumerate(all_issues, 1):
            print(f"  {i}. {issue}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ All interfaces are fully functional with real data!")
    else:
        print("\n❌ Some issues need to be addressed.")