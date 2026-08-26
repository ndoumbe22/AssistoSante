# 500 Error Debugging Implementation Summary

## Overview
This document summarizes the debugging implementation to capture and resolve the 500 error in the Django backend when creating appointments.

## Changes Made

### 1. Backend Debugging (sante_app/views.py)
Enhanced the `create` method in `RendezVousViewSet` with comprehensive logging:

```python
def create(self, request, *args, **kwargs):
    import json
    print("\n" + "="*60)
    print("🔍 CREATE RENDEZ-VOUS - DEBUG")
    print("="*60)
    print(f"📋 Request data: {json.dumps(request.data, indent=2)}")
    print(f"👤 User: {request.user}")
    print(f"🆔 User ID: {request.user.id}")
    print(f"📝 Content-Type: {request.content_type}")
    print("="*60 + "\n")
    
    try:
        # Récupérer les données
        medecin_id = request.data.get('medecin')
        date = request.data.get('date')
        heure = request.data.get('heure')
        motif = request.data.get('description', '')
        type_consultation = request.data.get('type_consultation', 'cabinet')
        
        print(f"Extracted data - medecin_id: {medecin_id}, date: {date}, heure: {heure}")
        
        # Valider les données
        if not medecin_id or not date or not heure:
            print(f"❌ Missing required fields - medecin_id: {medecin_id}, date: {date}, heure: {heure}")
            return Response({
                'error': 'medecin, date et heure sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer le rendez-vous
        from django.contrib.auth.models import User
        print(f"Looking up medecin with ID: {medecin_id}")
        medecin_user = User.objects.get(id=medecin_id)
        
        print(f"Creating RDV with patient: {request.user.id}, medecin: {medecin_user.id}, date: {date}, heure: {heure}")
        rdv = RendezVous.objects.create(
            patient=request.user,
            medecin=medecin_user,
            date=date,
            heure=heure,
            description=motif,
            type_consultation=type_consultation,
            statut='PENDING'
        )
        
        serializer = self.get_serializer(rdv)
        print(f"✅ SUCCESS: {serializer.data}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print("\n" + "="*60)
        print("❌ ERREUR CREATE RENDEZ-VOUS")
        print("="*60)
        print(f"Type d'erreur: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print("\n📚 TRACEBACK COMPLET:")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        
        return Response({
            'error': str(e),
            'type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 2. Serializer Enhancement (sante_app/serializers.py)
Updated `RendezVousSerializer` to properly handle `medecin_id`:

```python
class RendezVousSerializer(serializers.ModelSerializer):
    medecin_id = serializers.IntegerField(write_only=True, required=False)
    medecin_nom = serializers.CharField(source="medecin.get_full_name", read_only=True)
    patient_nom = serializers.CharField(source="patient.get_full_name", read_only=True)
    original_date = serializers.DateField(read_only=True)
    original_heure = serializers.TimeField(read_only=True)
    type_consultation = serializers.CharField(read_only=True)

    class Meta:
        model = RendezVous
        fields = ['id', 'medecin_id', 'date', 'heure', 'description', 'statut', 'type_consultation', 'medecin_nom', 'patient_nom', 
                  'original_date', 'original_heure', 'date_creation', 'date_modification']
        read_only_fields = ['patient', 'date_creation', 'date_modification']
    
    def create(self, validated_data):
        # Récupérer le patient depuis le request
        request = self.context.get('request')
        validated_data['patient'] = request.user
        
        # Gérer medecin_id si fourni
        medecin_id = validated_data.pop('medecin_id', None)
        if medecin_id:
            from django.contrib.auth.models import User
            medecin_user = User.objects.get(id=medecin_id)
            validated_data['medecin'] = medecin_user
        
        return super().create(validated_data)
```

### 3. Frontend Debugging (PriseDeRendezVous.jsx)
Enhanced the `handleConfirm` function with detailed logging:

```javascript
const handleConfirm = async () => {
  try {
    setLoading(true);
    // Create appointment
    // Validation finale
    console.log("\n=== 📤 ENVOI RENDEZ-VOUS ===");
    console.log("Médecin:", selectedMedecin);
    console.log("Date:", selectedDate);
    console.log("Heure:", selectedSlot);
    console.log("Motif:", motif);
    
    // Format des données
    const rendezVousData = {
      medecin_id: selectedMedecin?.user?.id || selectedMedecin?.id,
      date: selectedDate instanceof Date 
        ? selectedDate.toISOString().split('T')[0] 
        : selectedDate,
      heure: selectedSlot,
      description: motif || '',
      type_consultation: 'cabinet',
      statut: 'PENDING'
    };
    
    console.log("📦 Données formatées:", rendezVousData);
    console.log("📦 JSON stringify:", JSON.stringify(rendezVousData));
    
    // ... rest of validation logic
    
    const appointmentData = {
      medecin_id: medecinId, // Using doctor ID as integer
      date: formattedDate,
      heure: selectedSlot,
      description: motif,
      type_consultation: typeConsultation
    };
    
    console.log("📡 API Call - createAppointment");
    console.log("📤 Data envoyée:", appointmentData);
    
    const response = await appointmentAPI.createAppointment(appointmentData);
    
    console.log("✅ Réponse:", response);
    
    // ... rest of success handling
    
  } catch (error) {
    // Enhanced error handling
    console.error("=== ❌ ERREUR COMPLETE ===");
    console.error("Full error object:", error);
    console.error("❌ Error response:", error.response);
    console.error("❌ Error data:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
    
    // ... rest of error handling
  }
};
```

## Expected Debugging Output

When attempting to create an appointment, the system will now output detailed logs:

### Backend Logs:
1. Complete request data in JSON format
2. User information and ID
3. Content type of the request
4. Extracted field values
5. Any validation errors
6. Database operation details
7. Complete traceback for any exceptions

### Frontend Logs:
1. Formatted appointment data being sent
2. JSON representation of the data
3. API call details
4. Complete error information including:
   - Full error object
   - Error response
   - Error data
   - Error status code

## Next Steps

1. Restart the Django server to apply the changes
2. Attempt to create an appointment through the frontend
3. Check the Django terminal for detailed error logs
4. Check the browser console for frontend debugging information
5. Use the captured error information to identify and fix the root cause

This comprehensive debugging implementation will provide the exact information needed to resolve the 500 error.