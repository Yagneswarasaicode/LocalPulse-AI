import React, { useState } from 'react';
import { BuyerInquiry, Language } from '../../types';
import { marketplaceService } from '../../services/MarketplaceService';
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';

interface P2PBuyRequestsProps {
  currentBusinessId: string;
  currentBusinessName: string;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const P2PBuyRequests: React.FC<P2PBuyRequestsProps> = ({
  currentBusinessId,
  currentBusinessName,
  onNavigateTab,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const incomingInquiries = marketplaceService.getInquiriesForSeller(currentBusinessId);
  const outgoingInquiries = marketplaceService.getInquiriesForBuyer(currentBusinessId);

  const refreshInquiries = () => {
    // triggers re-render
    setActionMsg('');
    setErrorMsg('');
  };

  // Seller accepts inquiry
  const handleAccept = (inquiryId: string) => {
    setErrorMsg('');
    const res = marketplaceService.acceptInquiry(inquiryId);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to accept inquiry');
      return;
    }
    setActionMsg('Inquiry accepted! Agreed stock quantity is now reserved in inventory.');
    setTimeout(() => setActionMsg(''), 3000);
  };

  // Seller rejects inquiry
  const handleReject = (inquiryId: string) => {
    const reason = prompt('Please enter reason for rejection (e.g. stock no longer available):');
    if (!reason) return;
    marketplaceService.rejectInquiry(inquiryId, reason);
    setActionMsg('Inquiry rejected.');
    setTimeout(() => setActionMsg(''), 2500);
  };

  // Seller confirms handover
  const handleConfirmHandover = (inquiryId: string) => {
    if (!confirm('Confirm physical handover of goods and payment receipt? This will finalize the trade ledger and deduct seller inventory.')) {
      return;
    }

    const res = marketplaceService.confirmHandoverAndComplete(inquiryId);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to complete handover');
      return;
    }

    setActionMsg(`Trade completed! Recorded in Trade History and inventory deducted successfully.`);
    setTimeout(() => {
      onNavigateTab('trades');
    }, 1500);
  };

  // Buyer cancels inquiry
  const handleCancel = (inquiryId: string) => {
    if (!confirm('Cancel this purchase request? Any active reservation will be released.')) return;
    marketplaceService.cancelInquiry(inquiryId);
    setActionMsg('Purchase request cancelled.');
    setTimeout(() => setActionMsg(''), 2500);
  };

  const activeList = activeTab === 'incoming' ? incomingInquiries : outgoingInquiries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Purchase Requests & Trade Management
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Idempotent state transitions: Inquiry → Reservation → Confirmed Physical Handover.
          </p>
        </div>

        <div className="flex items-center bg-navy-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'incoming' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600'
            }`}
          >
            Incoming Buyer Inquiries ({incomingInquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'outgoing' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600'
            }`}
          >
            My Sent Requests ({outgoingInquiries.length})
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Inquiries List */}
      <div className="space-y-4">
        {activeList.length === 0 ? (
          <div className="bg-surface-card rounded-2xl p-12 border border-surface-border text-center space-y-2">
            <Inbox className="w-12 h-12 text-navy-300 mx-auto" />
            <h3 className="font-bold text-base text-navy-900">
              No {activeTab === 'incoming' ? 'incoming buyer inquiries' : 'outgoing purchase requests'}
            </h3>
            <p className="text-xs text-navy-500 max-w-sm mx-auto">
              {activeTab === 'incoming' 
                ? 'When nearby vendors or supermarkets request your surplus listings, they will appear here.'
                : 'Browse "Discover Nearby" to submit trade requests for available produce.'}
            </p>
          </div>
        ) : (
          activeList.map(inq => (
            <div
              key={inq.id}
              className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-navy-900">{inq.productName}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    inq.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    inq.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                    inq.status === 'handover_completed' ? 'bg-navy-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {inq.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-navy-600 flex items-center gap-2">
                  <span>{activeTab === 'incoming' ? `Buyer: ${inq.buyerBusinessName}` : `Seller: ${inq.sellerBusinessName}`}</span>
                  <span>•</span>
                  <span className="font-mono text-navy-400">Created: {inq.createdAt}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono pt-1">
                  <span>Quantity: <strong>{inq.requestedQuantity} {inq.unit}</strong></span>
                  <span>Price: <strong>₹{inq.agreedPricePerUnit} / {inq.unit}</strong></span>
                  <span className="font-extrabold text-emerald-700">Total: ₹{inq.totalOfferAmount}</span>
                </div>

                {inq.status === 'accepted' && (
                  <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                    ✓ Stock is actively reserved. Ready for physical pickup & handover.
                  </div>
                )}
                {inq.rejectedReason && (
                  <div className="text-[11px] text-rose-700 font-medium">
                    Reason: {inq.rejectedReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'incoming' && inq.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReject(inq.id)}
                      className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-bold text-navy-700 hover:bg-navy-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(inq.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
                    >
                      Accept & Reserve Stock
                    </button>
                  </>
                )}

                {activeTab === 'incoming' && inq.status === 'accepted' && (
                  <button
                    onClick={() => handleConfirmHandover(inq.id)}
                    className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm"
                  >
                    Confirm Handover & Complete Trade
                  </button>
                )}

                {activeTab === 'outgoing' && inq.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(inq.id)}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
