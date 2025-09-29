import { NextRequest, NextResponse } from 'next/server';
import database, { getBookingsByOccasion } from '@/lib/db-connect';

// GET /api/occasions - Get occasion data and templates from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const occasion = searchParams.get('occasion');
    
    // If specific occasion is requested, get data for that occasion
    if (occasion) {
      try {
        // Connect to database
        const connection = await database.connect();
        if (!connection.success) {
          // If database connection fails, return mock data
          const mockSuggestions = {
            occasion: occasion,
            commonNames: getMockNamesForOccasion(occasion),
            commonPatterns: [],
            suggestedFields: getOccasionFields(occasion)
          };

          return NextResponse.json({
            success: true,
            occasion: occasion,
            suggestions: mockSuggestions,
            timestamp: new Date().toISOString()
          });
        }

        // Get recent bookings for this occasion to suggest common names/patterns
        const recentBookings = await getBookingsByOccasion(occasion);
        
        // Extract common patterns from recent bookings
        const suggestions = {
          occasion: occasion,
          commonNames: [] as string[],
          commonPatterns: [] as string[],
          suggestedFields: getOccasionFields(occasion)
        };

        if (recentBookings.success && recentBookings.bookings) {
          // Extract common names based on occasion type
          const names: string[] = recentBookings.bookings
            .map(booking => {
              switch (occasion) {
                case 'Birthday Party':
                  return booking.birthdayName;
                case 'Anniversary':
                  return [booking.partner1Name, booking.partner2Name].filter(Boolean);
                case 'Date Night':
                  return booking.dateNightName;
                case 'Marriage Proposal':
                  return [booking.proposerName, booking.proposalPartnerName].filter(Boolean);
                case "Valentine's Day":
                  return booking.valentineName;
                default:
                  return booking.occasionPersonName;
              }
            })
            .flat()
            .filter(Boolean) as string[];

          // Get unique names and their frequency
          const nameCounts = names.reduce((acc, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          suggestions.commonNames = Object.entries(nameCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name]) => name);
        }

        // If no real data, use mock data
        if (suggestions.commonNames.length === 0) {
          suggestions.commonNames = getMockNamesForOccasion(occasion);
        }

        return NextResponse.json({
          success: true,
          occasion: occasion,
          suggestions: suggestions,
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Return mock data if database fails
        const mockSuggestions = {
          occasion: occasion,
          commonNames: getMockNamesForOccasion(occasion),
          commonPatterns: [],
          suggestedFields: getOccasionFields(occasion)
        };

        return NextResponse.json({
          success: true,
          occasion: occasion,
          suggestions: mockSuggestions,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Return all available occasions with their field templates
    const occasions = [
      {
        name: 'Birthday Party',
        fields: ['birthdayName', 'birthdayGender'],
        required: ['birthdayName'],
        labels: {
          birthdayName: 'Birthday Person Name',
          birthdayGender: 'Gender'
        }
      },
      {
        name: 'Anniversary',
        fields: ['partner1Name', 'partner2Name'],
        required: ['partner1Name', 'partner2Name'],
        labels: {
          partner1Name: 'Partner 1 Name',
          partner2Name: 'Partner 2 Name'
        }
      },
      {
        name: 'Baby Shower',
        fields: ['birthdayName'],
        required: ['birthdayName'],
        labels: {
          birthdayName: 'Mother-to-be Name'
        }
      },
      {
        name: 'Bride to be',
        fields: ['birthdayName'],
        required: ['birthdayName'],
        labels: {
          birthdayName: 'Bride Name'
        }
      },
      {
        name: 'Congratulations',
        fields: ['birthdayName'],
        required: ['birthdayName'],
        labels: {
          birthdayName: 'Person Name'
        }
      },
      {
        name: 'Farewell',
        fields: ['birthdayName'],
        required: ['birthdayName'],
        labels: {
          birthdayName: 'Person Name'
        }
      },
      {
        name: 'Marriage Proposal',
        fields: ['proposerName', 'proposalPartnerName'],
        required: ['proposerName', 'proposalPartnerName'],
        labels: {
          proposerName: 'Proposer Name',
          proposalPartnerName: 'Partner Name'
        }
      },
      {
        name: 'Romantic Date',
        fields: ['partner1Name', 'partner2Name'],
        required: ['partner1Name', 'partner2Name'],
        labels: {
          partner1Name: 'Partner 1 Name',
          partner2Name: 'Partner 2 Name'
        }
      },
      {
        name: "Valentine's Day",
        fields: ['valentineName'],
        required: ['valentineName'],
        labels: {
          valentineName: 'Valentine Name'
        }
      },
      {
        name: 'Date Night',
        fields: ['dateNightName'],
        required: ['dateNightName'],
        labels: {
          dateNightName: 'Person Name'
        }
      },
      {
        name: 'Custom Celebration',
        fields: ['customCelebration'],
        required: ['customCelebration'],
        labels: {
          customCelebration: 'Celebration Description'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      occasions: occasions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching occasion data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch occasion data' 
      },
      { status: 500 }
    );
  }
}

// Helper function to get occasion-specific fields
function getOccasionFields(occasion: string) {
  const fieldMap: Record<string, string[]> = {
    'Birthday Party': ['birthdayName', 'birthdayGender'],
    'Anniversary': ['partner1Name', 'partner2Name'],
    'Baby Shower': ['birthdayName'],
    'Bride to be': ['birthdayName'],
    'Congratulations': ['birthdayName'],
    'Farewell': ['birthdayName'],
    'Marriage Proposal': ['proposerName', 'proposalPartnerName'],
    'Romantic Date': ['partner1Name', 'partner2Name'],
    "Valentine's Day": ['valentineName'],
    'Date Night': ['dateNightName'],
    'Custom Celebration': ['customCelebration']
  };

  return fieldMap[occasion] || [];
}

// Helper function to get mock names for occasions
function getMockNamesForOccasion(occasion: string): string[] {
  const mockNames: Record<string, string[]> = {
    'Birthday Party': ['Priya', 'Rahul', 'Ananya', 'Arjun', 'Kavya'],
    'Anniversary': ['Priya & Rahul', 'Ananya & Arjun', 'Kavya & Vikram', 'Sneha & Raj', 'Pooja & Amit'],
    'Baby Shower': ['Priya', 'Ananya', 'Kavya', 'Sneha', 'Pooja'],
    'Bride to be': ['Priya', 'Ananya', 'Kavya', 'Sneha', 'Pooja'],
    'Congratulations': ['Priya', 'Rahul', 'Ananya', 'Arjun', 'Kavya'],
    'Farewell': ['Priya', 'Rahul', 'Ananya', 'Arjun', 'Kavya'],
    'Marriage Proposal': ['Rahul', 'Arjun', 'Vikram', 'Raj', 'Amit'],
    'Romantic Date': ['Priya & Rahul', 'Ananya & Arjun', 'Kavya & Vikram'],
    "Valentine's Day": ['Priya', 'Ananya', 'Kavya', 'Sneha', 'Pooja'],
    'Date Night': ['Priya', 'Ananya', 'Kavya', 'Sneha', 'Pooja'],
    'Custom Celebration': ['Special Event', 'Unique Celebration', 'Custom Party']
  };

  return mockNames[occasion] || ['Sample Name'];
}
