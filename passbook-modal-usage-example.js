// Usage Example for Updated PassbookAddEntryModal

import PassbookAddEntryModal from '@/components/client/PassbookAddEntryModal';

// Example 1: Adding a new entry (no entryToEdit prop)
function AddNewEntryExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <PassbookAddEntryModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      // No entryToEdit prop - this is for adding new entries
    />
  );
}

// Example 2: Editing an existing entry (with entryToEdit prop)
function EditEntryExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Sample existing entry data
  const existingEntry = {
    id: 'P1234567890',
    memberId: 'member_001',
    date: '2025-01-15',
    type: 'deposit',
    amount: 5000,
    description: 'Monthly deposit',
    balance: 15000,
    depositAmount: 5000,
    installmentAmount: 2000,
    interestAmount: 100,
    fineAmount: 0,
    paymentMode: 'cash'
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  return (
    <div>
      <button onClick={() => handleEdit(existingEntry)}>
        Edit Entry
      </button>
      
      <PassbookAddEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null); // Clear editing entry on close
        }}
        entryToEdit={editingEntry} // Pass the entry to edit
      />
    </div>
  );
}

// Expected Behavior:
// 1. When entryToEdit is provided, the modal will:
//    - Show "Edit Passbook Entry" as title
//    - Pre-fill all form fields with existing data
//    - Show "Update Entry" button
//    - Populate date picker with existing date
//    - Set payment mode to existing value

// 2. When entryToEdit is null/undefined, the modal will:
//    - Show "Add Passbook Entry" as title  
//    - Start with empty form fields
//    - Show "Create Entry" button
//    - Use current date as default
//    - Use 'cash' as default payment mode

// 3. Store Behavior:
//    - When installmentAmount > 0, it will deduct from active loan balance
//    - When depositAmount > 0, it will increase member's total deposits
//    - Loan status auto-updates to 'completed' when fully paid
//    - All changes are atomic and happen in a single state update