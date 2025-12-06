#!/bin/bash

echo "Adding MLS Export button to Studio..."

# First, let's see the current imports and add MlsExportModal
head -10 components/studio-client.tsx

# Create a patch to add the export functionality
# We need to:
# 1. Add import for MlsExportModal
# 2. Add state for showMlsExport
# 3. Add the Export button in the sidebar
# 4. Add the modal at the end

# Let's do this with sed replacements

# 1. Add import after HumanEditRequestModal import
sed -i '' 's|import { HumanEditRequestModal } from "./human-edit-request";|import { HumanEditRequestModal } from "./human-edit-request";\nimport { MlsExportModal } from "./mls-export-modal";|' components/studio-client.tsx

# 2. Add state - find useState section and add showMlsExport
# We'll add it after other modal states
sed -i '' 's|const \[showHumanEditModal, setShowHumanEditModal\] = useState(false);|const [showHumanEditModal, setShowHumanEditModal] = useState(false);\n  const [showMlsExport, setShowMlsExport] = useState(false);|' components/studio-client.tsx

# 3. Add Export button before the Share button in the header actions
# Look for the Share2 button and add MLS Export before it
sed -i '' 's|<button onClick={() => setShowShareModal(true)} className="p-2 hover:bg-white/10 rounded-lg" title="Share">|<button onClick={() => setShowMlsExport(true)} className="p-2 hover:bg-white/10 rounded-lg" title="MLS Export">\n            <FileArchive className="w-5 h-5" />\n          </button>\n          <button onClick={() => setShowShareModal(true)} className="p-2 hover:bg-white/10 rounded-lg" title="Share">|' components/studio-client.tsx

# 4. Add FileArchive to imports
sed -i '' 's|Download, Share2, Copy, LogOut|Download, Share2, Copy, LogOut, FileArchive|' components/studio-client.tsx

# 5. Add the modal at the end (before closing div of the component)
# Find the HumanEditRequestModal and add MlsExportModal after it
sed -i '' 's|{showHumanEditModal && selectedPhoto && (|{showMlsExport \&\& completedPhotos.length > 0 \&\& (\n        <MlsExportModal\n          photos={completedPhotos}\n          listingTitle={listing?.title}\n          listingAddress={listing?.address}\n          onClose={() => setShowMlsExport(false)}\n        />\n      )}\n      {showHumanEditModal \&\& selectedPhoto \&\& (|' components/studio-client.tsx

echo "✅ Studio updated with MLS Export button!"
echo ""
echo "Building to verify..."
npm run build 2>&1 | tail -25

