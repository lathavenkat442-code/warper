import { ScanVerificationModal } from './ScanVerificationModal';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Warper, YarnDispatch, WarperReturn, WarpOrder, DenierFormula, Weaver, Supplier, WarpSection, Loom, LoomTransaction } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Plus, User as UserIcon, Trash2, Settings, FileText, ChevronDown, ChevronUp, Search, Printer, Camera, ArrowDownLeft, ArrowUpRight, PieChart } from 'lucide-react';
import { YARN_COLORS, YARN_TYPES, PREDEFINED_COLORS } from '../constants';

interface WarpersProps {
  user: User;
  language: 'ta' | 'en';
  buttonColor?: string;
}

const DetailItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm font-bold text-gray-400">{label}</span>
    <span className="text-sm font-black text-gray-800">{value}</span>
  </div>
);

const Warpers: React.FC<WarpersProps> = ({ user, language, buttonColor = 'bg-zinc-600 hover:bg-zinc-700' }) => {
  const [warpers, setWarpers] = useState<Warper[]>([]);
  const [dispatches, setDispatches] = useState<YarnDispatch[]>([]);
  const [returns, setReturns] = useState<WarperReturn[]>([]);
  const [warpOrders, setWarpOrders] = useState<WarpOrder[]>([]);
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [denierFormulas, setDenierFormulas] = useState<DenierFormula[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [looms, setLooms] = useState<Loom[]>([]);
  
  const [selectedWarper, setSelectedWarper] = useState<Warper | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [statementPage, setStatementPage] = useState(1);
  const [ledgerSortOrder, setLedgerSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 25;

  const [viewType, setViewType] = useState<'received' | 'returned' | 'balance' | 'orders' | 'ledger' | 'all-warps'>('ledger');
  const [selectedDenier, setSelectedDenier] = useState<string>('');

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [isAddingReturn, setIsAddingReturn] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnDesignName, setReturnDesignName] = useState('');
  const [returnColor, setReturnColor] = useState('');
  const [returnWeight, setReturnWeight] = useState('');
  const [returnEnds, setReturnEnds] = useState('');
  const [returnLength, setReturnLength] = useState('1000'); // Default to 1000m
  const [returnWeaverId, setReturnWeaverId] = useState('');
  const [returnDenier, setReturnDenier] = useState('');

  const [isAddingDispatch, setIsAddingDispatch] = useState(false);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchDenier, setDispatchDenier] = useState('');
  const [dispatchColor, setDispatchColor] = useState('');
  const [dispatchWeight, setDispatchWeight] = useState('');
  const [dispatchSupplierId, setDispatchSupplierId] = useState('');
  const [dispatchBillNumber, setDispatchBillNumber] = useState('');

  const [isManagingFormulas, setIsManagingFormulas] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [newFormulaDenier, setNewFormulaDenier] = useState('');
  const [newFormulaMultiplier, setNewFormulaMultiplier] = useState('');
  const [isCustomDenier, setIsCustomDenier] = useState(false);

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderDesignName, setOrderDesignName] = useState('');
  const [orderWarpYarnType, setOrderWarpYarnType] = useState('');
  const [orderWeftYarnType, setOrderWeftYarnType] = useState('');
  const [orderSections, setOrderSections] = useState<WarpSection[]>(() => [{ id: Date.now().toString(), name: 'உடல்', ends: 0, color: '', length: 0 }]);
  const [orderTotalSarees, setOrderTotalSarees] = useState('');
  const [orderWarpLength, setOrderWarpLength] = useState('');
  const [orderTotalWeight, setOrderWarpWeight] = useState('');

  const [isAssigningOrder, setIsAssigningOrder] = useState<string | null>(null);
  const [assignWeaverId, setAssignWeaverId] = useState('');
  const [assignWeaverSearch, setAssignWeaverSearch] = useState('');
  const [showWeaverDropdown, setShowWeaverDropdown] = useState(false);
  const [assignLoomId, setAssignLoomId] = useState('');
  const [newLoomNumber, setNewLoomNumber] = useState('1');
  const [newLoomBreak, setNewLoomBreak] = useState('Right Break');
  const [editingWages, setEditingWages] = useState<Record<string, {wage: string, wagePaid: string}>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [warpSearchQuery, setWarpSearchQuery] = useState('');
  const [warpWageFilter, setWarpWageFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');

  // Statement filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewStatement, setViewStatement] = useState<string | null>(null);

  const [viewingDetail, setViewingDetail] = useState<{ type: 'dispatch' | 'order' | 'return', data: any } | null>(null);
  const [isViewingColorStatement, setIsViewingColorStatement] = useState(false);

  const warperDispatches = useMemo(() => {
    if (!selectedWarper) return [];
    return dispatches.filter(d => d.recipientType === 'warper' && d.recipientId === selectedWarper.id);
  }, [dispatches, selectedWarper]);

  const warperReturns = useMemo(() => {
    if (!selectedWarper) return [];
    return returns.filter(r => r.warperId === selectedWarper.id);
  }, [returns, selectedWarper]);

  const warperOrders = useMemo(() => {
    if (!selectedWarper) return [];
    return warpOrders.filter(o => o.warperId === selectedWarper.id).sort((a, b) => b.createdAt - a.createdAt);
  }, [warpOrders, selectedWarper]);

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (!isInitialLoad.current) return;
    isInitialLoad.current = false;

    setTimeout(() => {
      const savedWarpers = localStorage.getItem(`viyabaari_warpers_${user.uid || 'guest'}`);
      if (savedWarpers) setWarpers(JSON.parse(savedWarpers));

      const savedDispatches = localStorage.getItem(`viyabaari_yarn_dispatches_${user.uid || 'guest'}`);
      if (savedDispatches) setDispatches(JSON.parse(savedDispatches));

      const savedReturns = localStorage.getItem(`viyabaari_warper_returns_${user.uid || 'guest'}`);
      if (savedReturns) setReturns(JSON.parse(savedReturns));

      const savedWarpOrders = localStorage.getItem(`viyabaari_warp_orders_${user.uid || 'guest'}`);
      if (savedWarpOrders) setWarpOrders(JSON.parse(savedWarpOrders));

      const savedWeavers = localStorage.getItem(`viyabaari_weavers_${user.uid || 'guest'}`);
      if (savedWeavers) setWeavers(JSON.parse(savedWeavers));

      const savedLooms = localStorage.getItem(`viyabaari_looms_${user.uid || 'guest'}`);
      if (savedLooms) setLooms(JSON.parse(savedLooms));

      const savedSuppliers = localStorage.getItem(`viyabaari_suppliers_${user.uid || 'guest'}`);
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));

      const savedFormulas = localStorage.getItem(`viyabaari_denier_formulas_${user.uid || 'guest'}`);
      if (savedFormulas) {
        const parsed = JSON.parse(savedFormulas);
        setDenierFormulas(parsed);
        if (parsed.length > 0) setSelectedDenier(parsed[0].denier);
      }
    }, 0);
  }, [user.uid]);

  const saveWarpers = (newWarpers: Warper[]) => {
    setWarpers(newWarpers);
    localStorage.setItem(`viyabaari_warpers_${user.uid || 'guest'}`, JSON.stringify(newWarpers));
  };

  const saveReturns = (newReturns: WarperReturn[]) => {
    setReturns(newReturns);
    localStorage.setItem(`viyabaari_warper_returns_${user.uid || 'guest'}`, JSON.stringify(newReturns));
  };

  const saveDispatches = (newDispatches: YarnDispatch[]) => {
    setDispatches(newDispatches);
    localStorage.setItem(`viyabaari_yarn_dispatches_${user.uid || 'guest'}`, JSON.stringify(newDispatches));
  };

  const saveFormulas = (newFormulas: DenierFormula[]) => {
    setDenierFormulas(newFormulas);
    localStorage.setItem(`viyabaari_denier_formulas_${user.uid || 'guest'}`, JSON.stringify(newFormulas));
  };

  const saveWarpOrders = (newOrders: WarpOrder[]) => {
    setWarpOrders(newOrders);
    localStorage.setItem(`viyabaari_warp_orders_${user.uid || 'guest'}`, JSON.stringify(newOrders));
  };

  const saveLooms = (newLooms: Loom[]) => {
    setLooms(newLooms);
    localStorage.setItem(`viyabaari_looms_${user.uid || 'guest'}`, JSON.stringify(newLooms));
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newWarper: Warper = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      createdAt: Date.now()
    };
    saveWarpers([...warpers, newWarper]);
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
    alert(language === 'ta' ? 'வார்ப்பர் வெற்றிகரமாக சேர்க்கப்பட்டார்!' : 'Warper added successfully!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm(language === 'ta' ? 'நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete?')) {
      saveWarpers(warpers.filter(w => w.id !== id));
    }
  };

  const handleAddReturn = () => {
    if (!returnDate || !returnColor || !returnDenier || !selectedWarper) return;
    
    let finalWeight = parseFloat(returnWeight);
    const ends = parseInt(returnEnds);
    const length = parseFloat(returnLength) || 1000;
    
    if (!finalWeight && ends) {
      const formula = denierFormulas.find(f => f.denier === returnDenier);
      if (formula) {
        if (formula.gramsPerEnd) {
          // formula.gramsPerEnd is grams per 1000m
          finalWeight = (ends * formula.gramsPerEnd * length) / 1000000;
        } else {
          finalWeight = (ends * formula.multiplier * length) / 1000;
        }
      }
    }

    if (!finalWeight) {
      alert(language === 'ta' ? 'எடை அல்லது இழை அளவு தேவை' : 'Weight or Ends required');
      return;
    }

    const weaver = weavers.find(w => w.id === returnWeaverId);
    
    // Calculate next warpNumber (S.No)
    const maxWarpNumber = returns.reduce((max, r) => {
      const num = parseInt(r.warpNumber || '0');
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextWarpNumber = (maxWarpNumber + 1).toString();

    const newReturn: WarperReturn = {
      id: Date.now().toString(),
      warperId: selectedWarper.id,
      date: returnDate,
      warpNumber: nextWarpNumber,
      color: returnColor,
      weightKg: finalWeight,
      yarnType: returnDenier,
      weaverId: returnWeaverId,
      weaverName: weaver?.name,
      ends: ends || undefined,
      length: length,
      createdAt: Date.now()
    };
    
    saveReturns([...returns, newReturn]);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnOrderId('');
    setReturnDesignName('');
    setReturnColor('');
    setReturnWeight('');
    setReturnEnds('');
    setReturnLength('1000');
    setReturnWeaverId('');
    setReturnDenier('');
    setIsAddingReturn(false);
    alert(language === 'ta' ? 'வார்ப்பு வரவு வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Warp return saved successfully!');
  };

  const handleAddDispatch = () => {
    if (!dispatchDate || !dispatchDenier || !dispatchColor || !dispatchWeight || !selectedWarper) return;
    
    const selectedSupplier = suppliers.find(s => s.id === dispatchSupplierId);

    const newDispatch: YarnDispatch = {
      id: Date.now().toString(),
      date: dispatchDate,
      recipientType: 'warper',
      recipientId: selectedWarper.id,
      yarnCategory: 'warp',
      yarnType: dispatchDenier,
      color: dispatchColor,
      weightKg: parseFloat(dispatchWeight),
      supplierId: dispatchSupplierId || undefined,
      supplierName: selectedSupplier?.name || undefined,
      billNumber: dispatchBillNumber || undefined,
      createdAt: Date.now()
    };
    
    saveDispatches([...dispatches, newDispatch]);
    setDispatchColor('');
    setDispatchWeight('');
    setDispatchSupplierId('');
    setDispatchBillNumber('');
    setIsAddingDispatch(false);
    alert(language === 'ta' ? 'நூல் செலவு வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Yarn dispatch saved successfully!');
  };

  const handleAddFormula = () => {
    if (!newFormulaDenier || !newFormulaMultiplier) return;
    const grams = parseFloat(newFormulaMultiplier);
    const newFormula: DenierFormula = {
      id: Date.now().toString(),
      denier: newFormulaDenier,
      multiplier: grams / 1000,
      gramsPerEnd: grams
    };
    const updated = [...denierFormulas, newFormula];
    saveFormulas(updated);
    if (!selectedDenier) setSelectedDenier(newFormulaDenier);
    setNewFormulaDenier('');
    setNewFormulaMultiplier('');
    setIsCustomDenier(false);
  };

  const handleDeleteReturn = (id: string) => {
    if (window.confirm(language === 'ta' ? 'நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete?')) {
      saveReturns(returns.filter(r => r.id !== id));
    }
  };

  const handleOrderSectionChange = (index: number, field: keyof WarpSection, value: string | number) => {
    const newSections = [...orderSections];
    newSections[index] = { ...newSections[index], [field]: value };
    setOrderSections(newSections);
  };

  const addOrderSection = () => {
    setOrderSections([
      ...orderSections,
      { id: Date.now().toString(), name: language === 'ta' ? `பகுதி ${orderSections.length + 1}` : `Section ${orderSections.length + 1}`, ends: 0, color: '', length: 0 }
    ]);
  };

  const removeOrderSection = (index: number) => {
    setOrderSections(orderSections.filter((_, i) => i !== index));
  };

  const handleCreateOrder = () => {
    console.log("Creating order with:", { orderDesignName, orderWarpYarnType, orderWeftYarnType, orderTotalSarees, orderTotalWeight, calculatedOrderWeight, orderWarpLength, selectedWarper, orderSections });
    
    if (!orderDesignName) { alert(language === 'ta' ? 'தயவுசெய்து டிசைன் பெயரை உள்ளிடவும்' : 'Please enter design name'); return; }
    if (!orderWarpYarnType) { alert(language === 'ta' ? 'தயவுசெய்து வார்ப்பு நூல் வகையை தேர்ந்தெடுக்கவும்' : 'Please select warp yarn type'); return; }
    if (!orderWeftYarnType) { alert(language === 'ta' ? 'தயவுசெய்து நெசவு நூல் வகையை தேர்ந்தெடுக்கவும்' : 'Please select weft yarn type'); return; }
    if (!orderTotalSarees) { alert(language === 'ta' ? 'தயவுசெய்து மொத்த சேலைகளை உள்ளிடவும்' : 'Please enter total sarees'); return; }
    if (!(orderTotalWeight || calculatedOrderWeight)) { alert(language === 'ta' ? 'தயவுசெய்து எடையை உள்ளிடவும்' : 'Please enter weight'); return; }
    if (!orderWarpLength) { alert(language === 'ta' ? 'தயவுசெய்து வார்ப்பு நீளத்தை உள்ளிடவும்' : 'Please enter warp length'); return; }
    if (!selectedWarper) { alert(language === 'ta' ? 'தயவுசெய்து வார்ப்பரை தேர்ந்தெடுக்கவும்' : 'Please select a warper'); return; }

    if (orderSections.some(s => !s.color || !s.ends || s.ends <= 0)) {
      alert(language === 'ta' ? 'அனைத்து இழைகளும் மற்றும் கலர்களும் சரியாக உள்ளிடவும்' : 'Please fill all ends and colors correctly');
      return;
    }

    const currentYear = new Date().getFullYear();
    const ordersThisYear = warpOrders.filter(o => new Date(o.date).getFullYear() === currentYear);
    const maxId = ordersThisYear.reduce((max, order) => {
      const idPart = parseInt(order.orderNumber.replace('ORD-', ''));
      return isNaN(idPart) ? max : Math.max(max, idPart);
    }, 100);
    const newOrderNumber = `ORD-${maxId + 1}`;

    const timestamp = new Date().getTime();
    const newOrder: WarpOrder = {
      id: timestamp.toString() + '_stock_order',
      date: new Date().toISOString().split('T')[0],
      orderNumber: newOrderNumber,
      loomId: 'STOCK',
      weaverId: 'STOCK',
      weaverName: language === 'ta' ? 'ஸ்டாக் (Stock)' : 'Stock',
      loomNumber: '-',
      warperId: selectedWarper.id,
      designName: orderDesignName,
      warpYarnType: orderWarpYarnType,
      weftYarnType: orderWeftYarnType,
      sections: orderSections,
      totalEnds: orderSections.reduce((sum, sec) => sum + (sec.ends || 0), 0),
      totalLength: parseFloat(orderWarpLength) || 0,
      totalSareesExpected: parseInt(orderTotalSarees),
      warpLengthMeters: parseFloat(orderWarpLength),
      totalYarnWeight: parseFloat(orderTotalWeight || calculatedOrderWeight),
      status: 'pending',
      createdAt: timestamp
    };

    const newOrders = [...warpOrders, newOrder];
    saveWarpOrders(newOrders);

    setIsCreatingOrder(false);
    setOrderDesignName('');
    setOrderWarpYarnType('');
    setOrderWeftYarnType('');
    setOrderSections(() => [{ id: Date.now().toString(), name: 'உடல்', ends: 0, color: '', length: 0 }]);
    setOrderTotalSarees('');
    setOrderWarpLength('');
    setOrderWarpWeight('');
    setViewType('orders');
    
    alert(language === 'ta' ? 'புதிய வார்ப்பு ஆர்டர் வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'New Warp Order created successfully!');
  };

  const handleCompleteOrder = (orderId: string) => {
    const order = warpOrders.find(o => o.id === orderId);
    if (!order) return;

    // Change status to completed
    const updatedOrders = warpOrders.map(o => o.id === orderId ? { ...o, status: 'completed' as const } : o);
    saveWarpOrders(updatedOrders);

    // Calculate next warpNumber (S.No)
    const maxWarpNumber = returns.reduce((max, r) => {
      const num = parseInt(r.warpNumber || '0');
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextWarpNumber = (maxWarpNumber + 1).toString();

    // Create returns for each color section
    const newReturns: WarperReturn[] = [];
    
    // Group sections by color
    const colorEnds: Record<string, number> = {};
    order.sections.forEach(sec => {
      if (sec.color && sec.ends) {
        colorEnds[sec.color] = (colorEnds[sec.color] || 0) + sec.ends;
      }
    });

    const totalWeight = order.totalYarnWeight || 0;
    const totalEnds = order.totalEnds || 1; // avoid division by zero

    Object.entries(colorEnds).forEach(([color, ends]) => {
      // Proportional weight based on ends
      const weightKg = (ends / totalEnds) * totalWeight;
      
      const newReturn: WarperReturn = {
        id: new Date().getTime().toString() + '_' + Math.random().toString(36).substr(2, 9),
        warperId: order.warperId,
        warpNumber: nextWarpNumber,
        weaverId: order.weaverId === 'STOCK' ? undefined : order.weaverId,
        weaverName: order.weaverName === 'ஸ்டாக் (Stock)' || order.weaverName === 'Stock' ? undefined : order.weaverName,
        date: new Date().toISOString().split('T')[0],
        yarnType: order.warpYarnType || '',
        color: color,
        weightKg: weightKg,
        ends: ends,
        length: order.warpLengthMeters,
        orderId: order.id,
        createdAt: new Date().getTime()
      };
      newReturns.push(newReturn);
    });

    saveReturns([...returns, ...newReturns]);
    alert(language === 'ta' ? 'வார்ப்பு தயாராகிவிட்டது, லெஜரில் சேர்க்கப்பட்டது!' : 'Warp is ready and added to ledger!');
  };

  const handleAssignOrder = () => {
    if (!isAssigningOrder) return;

    if (!assignWeaverId && !assignWeaverSearch.trim()) {
      alert(language === 'ta' ? 'தயவுசெய்து தறிக்காரரை தேர்ந்தெடுக்கவும் அல்லது புதிதாக சேர்க்கவும்' : 'Please select or add a weaver');
      return;
    }

    let finalWeaverId = assignWeaverId;
    let finalWeaverName = '';

    if (!finalWeaverId && assignWeaverSearch.trim()) {
      // Create new weaver
      const newWeaver: Weaver = {
        id: Date.now().toString(),
        name: assignWeaverSearch.trim(),
        createdAt: Date.now()
      };
      const updatedWeavers = [...weavers, newWeaver];
      setWeavers(updatedWeavers);
      localStorage.setItem(`viyabaari_weavers_${user.uid || 'guest'}`, JSON.stringify(updatedWeavers));
      finalWeaverId = newWeaver.id;
      finalWeaverName = newWeaver.name;
    } else {
      finalWeaverName = weavers.find(w => w.id === finalWeaverId)?.name || '';
    }

    let finalLoomId = assignLoomId;
    let finalLoomNumber = '-';

    if (assignLoomId === 'ADD_NEW') {
      const breakText = newLoomBreak === 'Right Break' 
        ? (language === 'ta' ? 'ரைட் பிரேக்' : 'Right Break') 
        : (language === 'ta' ? 'லெஃப்ட் பிரேக்' : 'Left Break');
      const numberStr = `${newLoomNumber} - ${breakText}`;
      
      const newLoom: Loom = { 
        id: Date.now().toString(), 
        loomNumber: numberStr, 
        designName: '', 
        weaverId: finalWeaverId, 
        createdAt: Date.now() 
      };
      const updatedLooms = [...looms, newLoom];
      setLooms(updatedLooms);
      localStorage.setItem(`viyabaari_looms_${user.uid || 'guest'}`, JSON.stringify(updatedLooms));
      finalLoomId = newLoom.id;
      finalLoomNumber = newLoom.loomNumber || '-';
    } else {
      const loom = looms.find(l => l.id === assignLoomId);
      if (loom) {
        finalLoomNumber = loom.loomNumber || '-';
      } else {
        finalLoomId = 'UNASSIGNED';
      }
    }

    const updatedOrders = warpOrders.map(o => {
      if (o.id === isAssigningOrder) {
        return {
          ...o,
          weaverId: finalWeaverId,
          weaverName: finalWeaverName,
          loomId: finalLoomId,
          loomNumber: finalLoomNumber
        };
      }
      return o;
    });

    saveWarpOrders(updatedOrders);

    // Update warperReturns if the order was already completed
    const orderToUpdate = warpOrders.find(o => o.id === isAssigningOrder);
    if (orderToUpdate && orderToUpdate.status === 'completed') {
      const updatedReturns = returns.map(r => {
        if (r.orderId === isAssigningOrder) {
          return {
            ...r,
            weaverId: finalWeaverId,
            weaverName: finalWeaverName
          };
        }
        return r;
      });
      saveReturns(updatedReturns);

      // Update loom_txns if the order was already completed
      const savedTxns = localStorage.getItem(`viyabaari_loom_txns_${user.uid || 'guest'}`);
      if (savedTxns) {
        const currentTxns: LoomTransaction[] = JSON.parse(savedTxns);
        const updatedTxns = currentTxns.map(txn => {
          if (txn.warpOrderId === isAssigningOrder && txn.type === 'warp_loaded') {
            return {
              ...txn,
              loomId: finalLoomId
            };
          }
          return txn;
        });
        localStorage.setItem(`viyabaari_loom_txns_${user.uid || 'guest'}`, JSON.stringify(updatedTxns));
      }
    }

    setIsAssigningOrder(null);
    setAssignWeaverId('');
    setAssignWeaverSearch('');
    setAssignLoomId('');
    setNewLoomNumber('1');
    setNewLoomBreak('Right Break');
    alert(language === 'ta' ? 'வார்ப்பு வெற்றிகரமாக தறிக்காரருக்கு மாற்றப்பட்டது!' : 'Warp successfully assigned to weaver!');
  };


  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleScan triggered");
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    console.log("File selected:", file.name, file.type);

    setIsScanning(true);
    setScanStatus("ஸ்கேன் ஆகிறது... (Scanning...)");

    const reader = new FileReader();
    reader.onloadend = async () => {
      console.log("FileReader onloadend");
      const base64String = reader.result as string;
      
      // Resize image if too large
      const img = new Image();
      img.src = base64String;
      img.onload = async () => {
        console.log("Image loaded, resizing...");
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        
        try {
          console.log("Calling Gemini API...");
          if (!process.env.GEMINI_API_KEY) {
            console.error('Gemini API key is not configured.');
            setScanStatus('Gemini API key is not configured.');
            setIsScanning(false);
            return;
          }
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: resizedBase64,
                  },
                },
                {
                  text: `Extract the ledger entries from this image. Return the data as a JSON array of objects with fields: date (YYYY-MM-DD), weaverName (string), color (string), ends (number), weight (number), orderId (string, optional), length (number, optional). The current denier is ${selectedDenier}.`,
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
            },
          });
          
          console.log("Gemini Response:", response.text);
          const data = JSON.parse(response.text || '[]');
          console.log("Parsed Data:", data);
          
          const formula = denierFormulas.find(f => f.denier === selectedDenier);
          const validatedData = data.map((entry: any) => {
            const multiplier = formula ? (formula.gramsPerEnd ? formula.gramsPerEnd / 1000 : formula.multiplier) : 0;
            const expectedWeight = entry.ends * multiplier;
            const isValid = formula ? Math.abs(entry.weight - expectedWeight) < 0.1 : true;
            return { ...entry, isValid, expectedWeight };
          });

          setScannedData(validatedData);
          setIsScanning(false);
          setScanStatus(null);
        } catch (error) {
          console.error("Error scanning:", error);
          setScanStatus('Error scanning: ' + error);
          setIsScanning(false);
        }
      };
      img.onerror = (err) => {
        console.error("Image load error:", err);
        setScanStatus("Image load error");
        setIsScanning(false);
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setScanStatus("FileReader error");
      setIsScanning(false);
    }
    reader.readAsDataURL(file);
  };

  const handleSaveScannedData = (data: any[]) => {
    const newReturns = data.map(entry => {
      const weaver = weavers.find(w => w.name === entry.weaverName);
      return {
        id: Date.now().toString() + Math.random(),
        warperId: selectedWarper?.id || '',
        date: entry.date,
        color: entry.color,
        weightKg: entry.weight,
        yarnType: selectedDenier,
        ends: entry.ends,
        weaverId: weaver?.id,
        weaverName: entry.weaverName,
        orderId: entry.orderId,
        length: entry.length,
        createdAt: Date.now()
      };
    });
    saveReturns([...returns, ...newReturns]);
    setScannedData(null);
    alert(language === 'ta' ? 'அனைத்து பதிவுகளும் வெற்றிகரமாக சேமிக்கப்பட்டன!' : 'All records saved successfully!');
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm(language === 'ta' ? 'இந்த ஆர்டரை நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete this order?')) {
      saveWarpOrders(warpOrders.filter(o => o.id !== orderId));
    }
  };

  const handleUpdateWage = (orderId: string) => {
    const editState = editingWages[orderId];
    if (!editState) return;

    const updatedOrders = warpOrders.map(o => {
      if (o.id === orderId) {
        const newWagePaid = editState.wagePaid ? parseFloat(editState.wagePaid) : 0;
        return {
          ...o,
          wage: editState.wage ? parseFloat(editState.wage) : undefined,
          wagePaid: newWagePaid > 0 ? newWagePaid : undefined
        };
      }
      return o;
    });
    saveWarpOrders(updatedOrders);
    alert(language === 'ta' ? 'கூலி விவரங்கள் சேமிக்கப்பட்டன!' : 'Wage details saved!');
  };

  const warperBalances = useMemo(() => {
    if (!selectedWarper) return [];
    
    const balances: Record<string, { received: number, returned: number }> = {};
    
    warperDispatches.forEach(dispatch => {
      const color = dispatch.color || 'Unknown';
      const yarnType = dispatch.yarnType || 'Unknown';
      const key = `${yarnType}|${color}`;
      if (!balances[key]) balances[key] = { received: 0, returned: 0 };
      balances[key].received += dispatch.weightKg;
    });
    
    warperReturns.forEach(ret => {
      const color = ret.color || 'Unknown';
      const yarnType = ret.yarnType || 'Unknown';
      const key = `${yarnType}|${color}`;
      if (!balances[key]) balances[key] = { received: 0, returned: 0 };
      balances[key].returned += (ret.weightKg || 0);
    });
    
    return Object.entries(balances).map(([key, data]) => {
      const [yarnType, color] = key.split('|');
      return {
        yarnType,
        color,
        received: data.received,
        returned: data.returned,
        balance: data.received - data.returned
      };
    }).sort((a, b) => {
      if (a.yarnType !== b.yarnType) return a.yarnType.localeCompare(b.yarnType);
      return b.balance - a.balance;
    });
  }, [warperDispatches, warperReturns, selectedWarper]);

  const totalEnds = orderSections.reduce((sum, sec) => sum + (sec.ends || 0), 0);
  const orderLength = parseFloat(orderWarpLength) || 0;
  const orderFormula = denierFormulas.find(f => f.denier === orderWarpYarnType);
  
  const calculatedOrderWeight = (() => {
    if (!orderFormula || totalEnds === 0 || orderLength === 0) return '0.00';
    const gramsPerEnd = orderFormula.gramsPerEnd || orderFormula.multiplier;
    const weightKg = (totalEnds * gramsPerEnd * orderLength) / 1000000;
    return weightKg.toFixed(2);
  })();

  const returnEndsVal = parseInt(returnEnds) || 0;
  const returnLengthVal = parseFloat(returnLength) || 0;
  const returnFormula = denierFormulas.find(f => f.denier === returnDenier);

  const calculatedReturnWeight = (() => {
    if (!returnFormula || returnEndsVal === 0 || returnLengthVal === 0) return '0.00';
    const gramsPerEnd = returnFormula.gramsPerEnd || returnFormula.multiplier;
    const weightKg = (returnEndsVal * gramsPerEnd * returnLengthVal) / 1000000;
    return weightKg.toFixed(2);
  })();

  // Render Warper Account View
  if (viewStatement) {
    const warper = warpers.find(w => w.id === viewStatement);
    if (!warper) return null;

    let statementDispatches = dispatches.filter(d => d.recipientType === 'warper' && d.recipientId === warper.id);
    let statementReturns = returns.filter(r => r.warperId === warper.id);
    
    if (startDate) {
      statementDispatches = statementDispatches.filter(d => d.date >= startDate);
      statementReturns = statementReturns.filter(r => r.date >= startDate);
    }
    if (endDate) {
      statementDispatches = statementDispatches.filter(d => d.date <= endDate);
      statementReturns = statementReturns.filter(r => r.date <= endDate);
    }

    const allTxns = [
      ...statementDispatches.map(d => ({ ...d, isDispatch: true, timestamp: new Date(d.date).getTime() })),
      ...statementReturns.map(r => ({ ...r, isDispatch: false, timestamp: new Date(r.date).getTime() }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    const totalPages = Math.ceil(allTxns.length / pageSize);
    const paginatedTxns = allTxns.slice((statementPage - 1) * pageSize, statementPage * pageSize);

    const totalReceived = statementDispatches.reduce((sum, d) => sum + d.weightKg, 0);
    const totalReturned = statementReturns.reduce((sum, r) => sum + (r.weightKg || 0), 0);
    const balance = totalReceived - totalReturned;

    return (
      <div className="bg-white min-h-screen p-4 md:p-8">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewStatement(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
            <h2 className="text-xl font-black text-gray-800">{warper.name}</h2>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500">{language === 'ta' ? 'முதல்:' : 'From:'}</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
              <span className="text-xs font-bold text-gray-500 ml-2">{language === 'ta' ? 'வரை:' : 'To:'}</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
              {(startDate || endDate) && (
                <button onClick={() => {setStartDate(''); setEndDate('');}} className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold">
                  {language === 'ta' ? 'அழி' : 'Clear'}
                </button>
              )}
            </div>
            <button onClick={() => window.print()} className={`flex items-center gap-2 ${buttonColor} text-white px-4 py-2 rounded-xl font-bold transition`}>
              <Printer size={18} /> {language === 'ta' ? 'பிரிண்ட் / டவுன்லோட்' : 'Print / Download'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-6 print:border-none print:p-0">
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-2">{language === 'ta' ? 'வார்ப்புகாரர் அறிக்கை' : 'Warper Statement'}</h1>
            <h2 className="text-xl font-bold text-gray-700">{warper.name}</h2>
            {warper.phone && <p className="text-gray-500 mt-1">{warper.phone}</p>}
            {(startDate || endDate) && (
              <p className="text-sm font-bold text-gray-500 mt-2">
                {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
              </p>
            )}
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden print:border-none print:overflow-visible">
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] print:max-h-none">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-sm print:static print:shadow-none">
                  <tr className="border-b-2 border-gray-200 text-gray-600">
                    <th className="py-3 px-4 font-bold bg-white">{language === 'ta' ? 'தேதி' : 'Date'}</th>
                    <th className="py-3 px-4 font-bold bg-white">{language === 'ta' ? 'வ.எண்' : 'S.No'}</th>
                    <th className="py-3 px-4 font-bold bg-white">{language === 'ta' ? 'விவரம்' : 'Details'}</th>
                    <th className="py-3 px-4 font-bold text-center bg-white">{language === 'ta' ? 'மீட்டர்' : 'Meter'}</th>
                    <th className="py-3 px-4 font-bold text-right bg-white">{language === 'ta' ? 'வரவு (kg)' : 'Received'}</th>
                    <th className="py-3 px-4 font-bold text-right text-green-600 bg-white">{language === 'ta' ? 'திரும்பியது (kg)' : 'Returned'}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTxns.map((txn: any, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-800">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{(statementPage - 1) * pageSize + idx + 1}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {txn.isDispatch ? (
                          <span className="flex items-center gap-1"><ArrowDownLeft size={14} className="text-blue-500" /> {txn.yarnType} {txn.color}</span>
                        ) : (
                          <span className="flex items-center gap-1"><ArrowUpRight size={14} className="text-emerald-500" /> {txn.yarnType} {txn.color} {txn.ends ? `(${txn.ends} Ends)` : ''} {txn.warpNumber ? `(${language === 'ta' ? 'வ.எண்:' : 'S.No:'} ${txn.warpNumber})` : ''}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {!txn.isDispatch ? (txn.length || warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId)?.warpLengthMeters || '-') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">{txn.isDispatch ? txn.weightKg.toFixed(2) : '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{!txn.isDispatch ? txn.weightKg.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                  {paginatedTxns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                        {language === 'ta' ? 'பதிவுகள் இல்லை' : 'No records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between print:hidden">
                <div className="text-xs font-bold text-gray-500">
                  {language === 'ta' ? `பக்கம் ${statementPage} / ${totalPages}` : `Page ${statementPage} of ${totalPages}`}
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={statementPage === 1}
                    onClick={() => setStatementPage(prev => Math.max(1, prev - 1))}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    {language === 'ta' ? 'முந்தைய' : 'Prev'}
                  </button>
                  <button 
                    disabled={statementPage === totalPages}
                    onClick={() => setStatementPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    {language === 'ta' ? 'அடுத்த' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-3 bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between text-blue-600 font-bold">
                <span>{language === 'ta' ? 'மொத்த வரவு' : 'Total Received'}</span>
                <span>{totalReceived.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>{language === 'ta' ? 'மொத்தம் திரும்பியது' : 'Total Returned'}</span>
                <span>{totalReturned.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-xl font-black text-gray-900 border-t pt-3">
                <span>{language === 'ta' ? 'பாக்கி' : 'Balance'}</span>
                <span className={balance > 0 ? 'text-red-600' : ''}>{balance.toFixed(2)} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isViewingColorStatement && selectedWarper) {
    const dDispatches = warperDispatches.filter(d => d.yarnType === selectedDenier);
    const dReturns = warperReturns.filter(r => r.yarnType === selectedDenier);
    
    const allColors = Array.from(new Set([
      ...dDispatches.map(d => d.color || 'Unknown'),
      ...dReturns.map(r => r.color || 'Unknown')
    ])).filter(Boolean) as string[];

    const groupedReturns = Object.values(dReturns.reduce((acc, r) => {
      const key = r.orderId || r.id;
      if (!acc[key]) {
        acc[key] = {
          ...r,
          isDispatch: false,
          timestamp: new Date(r.date).getTime(),
          colors: { [r.color || 'Unknown']: [r.weightKg || 0] },
          endsTotal: r.ends || 0
        };
      } else {
        if (acc[key].colors[r.color || 'Unknown']) {
          acc[key].colors[r.color || 'Unknown'].push(r.weightKg || 0);
        } else {
          acc[key].colors[r.color || 'Unknown'] = [r.weightKg || 0];
        }
        acc[key].endsTotal += (r.ends || 0);
      }
      return acc;
    }, {} as Record<string, any>));

    const allTxns = [
      ...dDispatches.map(d => ({ ...d, isDispatch: true, timestamp: new Date(d.date).getTime(), colors: { [d.color || 'Unknown']: [d.weightKg || 0] }, endsTotal: 0 })),
      ...groupedReturns
    ].sort((a, b) => a.timestamp - b.timestamp);

    const runningBalances: Record<string, number> = {};
    allColors.forEach(c => runningBalances[c] = 0);
    allTxns.forEach((txn: any) => {
      Object.entries(txn.colors).forEach(([c, weights]) => {
        const totalW = (weights as number[]).reduce((sum, w) => sum + w, 0);
        if (txn.isDispatch) runningBalances[c] += totalW;
        else runningBalances[c] -= totalW;
      });
    });

    return (
      <div className="bg-white min-h-screen p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsViewingColorStatement(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
            <h2 className="text-xl font-black text-gray-800">{selectedWarper.name}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className={`flex items-center gap-2 ${buttonColor} text-white px-4 py-2 rounded-xl font-bold transition`}>
              <Printer size={18} /> {language === 'ta' ? 'பிரிண்ட் / டவுன்லோட்' : 'Print / Download'}
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto border border-gray-200 rounded-2xl p-6 print:border-none print:p-0">
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-2">{language === 'ta' ? 'வார்ப்பு கணக்கு அறிக்கை' : 'Warp Account Statement'}</h1>
            <h2 className="text-xl font-bold text-gray-700">{selectedWarper.name}</h2>
            <p className="text-sm font-bold text-gray-500 mt-1">{selectedDenier} {language === 'ta' ? 'டீனியர்' : 'Denier'}</p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200 text-gray-600">
                <th className="py-3 px-2 font-bold">{language === 'ta' ? 'தேதி' : 'Date'}</th>
                <th className="py-3 px-2 font-bold">{language === 'ta' ? 'வ.எண்' : 'S.No'}</th>
                <th className="py-3 px-2 font-bold">{language === 'ta' ? 'விவரம்' : 'Details'}</th>
                <th className="py-3 px-2 font-bold text-center">{language === 'ta' ? 'இழை' : 'Ends'}</th>
                <th className="py-3 px-2 font-bold text-center">{language === 'ta' ? 'மீட்டர்' : 'Meter'}</th>
                {allColors.map(c => (
                  <th key={c} className="py-3 px-2 font-bold text-right">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTxns.map((txn: any, idx) => {
                let particulars = '';
                if (txn.isDispatch) {
                  particulars = language === 'ta' ? 'நூல் வரவு' : 'Yarn Given';
                } else {
                  const order = warpOrders.find(o => o.id === txn.orderId);
                  if (order) {
                    particulars = `${order.orderNumber || ''} - ${order.weaverName || ''}`;
                  } else {
                    particulars = txn.weaverName || (language === 'ta' ? 'வரவு' : 'Return');
                  }
                  if (txn.warpNumber) particulars += ` (${language === 'ta' ? 'வ.எண்:' : 'S.No:'} ${txn.warpNumber})`;
                }

                return (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-gray-800">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-gray-800 font-medium">{idx + 1}</td>
                    <td className="py-3 px-2 text-gray-800 font-bold">{particulars}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-700">{!txn.isDispatch && txn.endsTotal ? txn.endsTotal : '-'}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-700">
                      {!txn.isDispatch ? (txn.length || warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId)?.warpLengthMeters || '-') : '-'}
                    </td>
                    {allColors.map(c => {
                      const weights = txn.colors[c] as number[];
                      if (!weights || weights.length === 0) return <td key={c} className="py-3 px-2 text-right text-gray-300">-</td>;
                      const totalW = weights.reduce((sum, w) => sum + w, 0);
                      return (
                        <td key={c} className={`py-3 px-2 text-right font-bold ${txn.isDispatch ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {txn.isDispatch ? `+${totalW.toFixed(2)}` : `-${totalW.toFixed(2)}`}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-black">
              <tr>
                <td colSpan={5} className="py-4 px-2 text-right text-gray-900">{language === 'ta' ? 'மீதம் (Bal):' : 'Balance:'}</td>
                {allColors.map(c => (
                  <td key={c} className={`py-4 px-2 text-right ${runningBalances[c] > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {runningBalances[c].toFixed(2)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  if (selectedWarper) {
    const filteredWarperOrders = warperOrders.filter(order => {
      // Search
      const searchLower = warpSearchQuery.toLowerCase();
      const matchesSearch = 
        (order.orderNumber || '').toLowerCase().includes(searchLower) ||
        (order.weaverName || '').toLowerCase().includes(searchLower) ||
        (order.loomNumber || '').toLowerCase().includes(searchLower) ||
        (order.designName || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filter
      const wage = order.wage || 0;
      const wagePaid = order.wagePaid || 0;

      if (warpWageFilter === 'PAID') {
        return wage > 0 && wagePaid >= wage;
      } else if (warpWageFilter === 'UNPAID') {
        return wagePaid === 0;
      } else if (warpWageFilter === 'PARTIAL') {
        return wagePaid > 0 && wagePaid < wage;
      }

      return true;
    });

    return (
      <div className="p-4 pb-24 md:pb-4 md:max-w-none mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedWarper(null)}
              className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
            >
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-800">{selectedWarper.name}</h2>
              {selectedWarper.phone && <p className="text-xs font-bold text-gray-500">{selectedWarper.phone}</p>}
            </div>
          </div>
          <button 
            onClick={() => setViewStatement(selectedWarper.id)}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 flex items-center gap-1"
          >
            <FileText size={14} /> {language === 'ta' ? 'அறிக்கை' : 'Statement'}
          </button>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setViewType('ledger')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'ledger' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'கணக்கு நோட்டு' : 'Ledger'}
          </button>
          <button 
            onClick={() => setViewType('balance')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'balance' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'இருப்பு' : 'Balance'}
          </button>
          <button 
            onClick={() => setViewType('received')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'received' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'கொடுத்தது' : 'Given'}
          </button>
          <button 
            onClick={() => setViewType('returned')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'returned' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'வந்தது' : 'Returned'}
          </button>
          <button 
            onClick={() => setViewType('orders')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'orders' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'வார்ப்பு ஆர்டர்' : 'Warp Orders'}
          </button>
          <button 
            onClick={() => setViewType('all-warps')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'all-warps' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'அனைத்து வார்ப்புகள்' : 'All Warps'}
          </button>
        </div>

        {viewType === 'ledger' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 mr-2">
                <select 
                  value={selectedDenier}
                  onChange={e => { setSelectedDenier(e.target.value); setLedgerPage(1); }}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-zinc-400 shadow-sm"
                >
                  <option value="">{language === 'ta' ? '-- டீனியர் --' : '-- Denier --'}</option>
                  {denierFormulas.map(f => (
                    <option key={f.id} value={f.denier}>{f.denier}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => setIsManagingFormulas(true)}
                className="p-2 bg-white text-gray-500 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50"
                title={language === 'ta' ? 'ஃபார்முலா செட்டிங்ஸ்' : 'Formula Settings'}
              >
                <Settings size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setIsAddingDispatch(true)}
                className="flex-1 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-zinc-100 transition"
              >
                <ArrowDownLeft size={16} /> {language === 'ta' ? 'நூல் வரவு' : 'Yarn Given'}
              </button>
              <button
                onClick={() => setShowScanOptions(true)}
                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition cursor-pointer"
              >
                <Camera size={16} /> {language === 'ta' ? 'ஸ்கேன் செய்' : 'Scan'}
              </button>
              <button
                onClick={() => setIsViewingColorStatement(true)}
                className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition cursor-pointer"
              >
                <FileText size={16} /> {language === 'ta' ? 'அறிக்கை' : 'Statement'}
              </button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleScan}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={galleryInputRef}
                onChange={handleScan}
              />
              {showScanOptions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowScanOptions(false)}>
                  <div className="bg-white p-4 rounded-2xl shadow-xl w-64 space-y-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setShowScanOptions(false); cameraInputRef.current?.click(); }} className="w-full py-3 bg-zinc-100 rounded-xl font-bold">{language === 'ta' ? 'கேமரா' : 'Camera'}</button>
                    <button onClick={() => { setShowScanOptions(false); galleryInputRef.current?.click(); }} className="w-full py-3 bg-zinc-100 rounded-xl font-bold">{language === 'ta' ? 'கேலரி' : 'Gallery'}</button>
                    <button onClick={() => setShowScanOptions(false)} className="w-full py-3 bg-gray-200 rounded-xl font-bold">{language === 'ta' ? 'ரத்து' : 'Cancel'}</button>
                  </div>
                </div>
              )}
            </div>

            {scannedData && (
              <ScanVerificationModal 
                data={scannedData} 
                onClose={() => setScannedData(null)} 
                onSave={handleSaveScannedData}
                language={language}
              />
            )}

            {selectedDenier ? (() => {
              const dDispatches = warperDispatches.filter(d => d.yarnType === selectedDenier);
              const dReturns = warperReturns.filter(r => r.yarnType === selectedDenier);
              
              const allColors = Array.from(new Set([
                ...dDispatches.map(d => d.color || 'Unknown'),
                ...dReturns.map(r => r.color || 'Unknown')
              ])).filter(Boolean) as string[];

              const groupedReturns = Object.values(dReturns.reduce((acc, r) => {
                const key = r.orderId || r.id;
                if (!acc[key]) {
                  acc[key] = {
                    ...r,
                    isDispatch: false,
                    timestamp: new Date(r.date).getTime(),
                    colors: { [r.color || 'Unknown']: [r.weightKg || 0] },
                    endsTotal: r.ends || 0
                  };
                } else {
                  if (acc[key].colors[r.color || 'Unknown']) {
                    acc[key].colors[r.color || 'Unknown'].push(r.weightKg || 0);
                  } else {
                    acc[key].colors[r.color || 'Unknown'] = [r.weightKg || 0];
                  }
                  acc[key].endsTotal += (r.ends || 0);
                }
                return acc;
              }, {} as Record<string, any>));

              const allTxns = [
                ...dDispatches.map(d => ({ ...d, isDispatch: true, timestamp: new Date(d.date).getTime(), colors: { [d.color || 'Unknown']: [d.weightKg || 0] }, endsTotal: 0 })),
                ...groupedReturns
              ].sort((a, b) => ledgerSortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

              const totalPages = Math.ceil(allTxns.length / pageSize);
              const paginatedTxns = allTxns.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize);

              const runningBalances: Record<string, number> = {};
              allColors.forEach(c => runningBalances[c] = 0);
              
              // Calculate running balances for all transactions to show correct balance at the end of the page
              // However, usually running balance is cumulative. 
              // If we paginate, we still need the total balance.
              allTxns.forEach((txn: any) => {
                Object.entries(txn.colors).forEach(([c, weights]) => {
                  const totalW = (weights as number[]).reduce((sum, w) => sum + w, 0);
                  if (txn.isDispatch) {
                    runningBalances[c] += totalW;
                  } else {
                    runningBalances[c] -= totalW;
                  }
                });
              });

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="overflow-x-auto overflow-y-auto max-h-[60vh] scrollbar-thin">
                    <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-bold border-b border-gray-100 shadow-sm">
                        <tr>
                          <th 
                            className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex items-center gap-1"
                            onClick={() => setLedgerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          >
                            {language === 'ta' ? 'தேதி' : 'Date'}
                            <div className="flex flex-col">
                              <ChevronUp size={10} className={ledgerSortOrder === 'asc' ? 'text-zinc-600' : 'text-gray-300'} />
                              <ChevronDown size={10} className={ledgerSortOrder === 'desc' ? 'text-zinc-600' : 'text-gray-300'} />
                            </div>
                          </th>
                          <th className="p-3 bg-gray-50">{language === 'ta' ? 'வ.எண்' : 'S.No'}</th>
                          <th className="p-3 bg-gray-50">{language === 'ta' ? 'விவரம்' : 'Particulars'}</th>
                          <th className="p-3 text-center bg-gray-50">{language === 'ta' ? 'இழை' : 'Ends'}</th>
                          <th className="p-3 text-center bg-gray-50">{language === 'ta' ? 'மீட்டர்' : 'Meter'}</th>
                          {allColors.map(c => (
                            <th key={c} className="p-3 text-right text-zinc-600 bg-gray-50">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {paginatedTxns.length === 0 ? (
                          <tr>
                            <td colSpan={5 + allColors.length} className="p-8 text-center text-gray-400">
                              {language === 'ta' ? 'பதிவுகள் இல்லை' : 'No records found'}
                            </td>
                          </tr>
                        ) : (
                          paginatedTxns.map((txn: any, idx: number) => {
                            let particulars = '';
                            if (txn.isDispatch) {
                              particulars = language === 'ta' ? 'நூல் வரவு' : 'Yarn Given';
                            } else {
                              const order = warpOrders.find(o => o.id === txn.orderId);
                              let baseParticulars = '';
                              if (order) {
                                const orderNum = order.orderNumber || '';
                                if (order.weaverId === 'STOCK') {
                                  baseParticulars = `Stock - ${orderNum}`;
                                } else {
                                  baseParticulars = `${orderNum} - ${order.weaverName || ''}`;
                                }
                              } else {
                                baseParticulars = txn.weaverName || (language === 'ta' ? 'வரவு' : 'Return');
                              }
                              
                              if (txn.warpNumber) {
                                particulars = `${baseParticulars} (${language === 'ta' ? 'வ.எண்:' : 'S.No:'} ${txn.warpNumber})`;
                              } else {
                                particulars = baseParticulars;
                              }
                            }

                            return (
                              <tr key={txn.id} className="hover:bg-gray-50/50 transition">
                                <td className="p-3 text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                                <td className="p-3 text-gray-500 font-medium">{(ledgerPage - 1) * pageSize + idx + 1}</td>
                                <td className="p-3 font-medium text-gray-800">
                                  <button 
                                    onClick={() => {
                                      if (txn.isDispatch) {
                                        setViewingDetail({ type: 'dispatch', data: txn });
                                      } else {
                                        const order = warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId);
                                        if (order) {
                                          setViewingDetail({ type: 'order', data: order });
                                        } else {
                                          setViewingDetail({ type: 'return', data: txn });
                                        }
                                      }
                                    }}
                                    className="text-left hover:text-blue-600 transition-colors"
                                  >
                                    {particulars}
                                  </button>
                                </td>
                                <td className="p-3 text-center font-bold text-gray-600">{!txn.isDispatch && txn.endsTotal ? txn.endsTotal : '-'}</td>
                                <td className="p-3 text-center font-bold text-gray-600">
                                  {!txn.isDispatch ? (txn.length || warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId)?.warpLengthMeters || '-') : '-'}
                                </td>
                                {allColors.map(c => {
                                  const weights = txn.colors[c] as number[];
                                  if (!weights || weights.length === 0) {
                                    return <td key={c} className="p-3 text-right text-gray-300"></td>;
                                  }
                                  const displayStr = weights.map(w => w.toFixed(2)).join(' + ');
                                  return (
                                    <td key={c} className={`p-3 text-right font-bold ${txn.isDispatch ? 'text-zinc-600' : 'text-emerald-600'}`}>
                                      {txn.isDispatch ? `+${displayStr}` : `-${displayStr}`}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-100 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                        <tr>
                          <td colSpan={5} className="p-3 font-black text-right text-gray-600 bg-gray-50">{language === 'ta' ? 'மீதம் (Bal):' : 'Balance:'}</td>
                          {allColors.map(c => (
                            <td key={c} className={`p-3 text-right font-black bg-gray-50 ${runningBalances[c] > 0 ? 'text-red-500' : runningBalances[c] < 0 ? 'text-emerald-500' : 'text-gray-800'}`}>
                              {runningBalances[c].toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-gray-500">
                        {language === 'ta' ? `பக்கம் ${ledgerPage} / ${totalPages}` : `Page ${ledgerPage} of ${totalPages}`}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          disabled={ledgerPage === 1}
                          onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {language === 'ta' ? 'முந்தைய' : 'Prev'}
                        </button>
                        <button 
                          disabled={ledgerPage === totalPages}
                          onClick={() => setLedgerPage(prev => Math.min(totalPages, prev + 1))}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {language === 'ta' ? 'அடுத்த' : 'Next'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-bold tamil-font text-sm">
                  {language === 'ta' ? 'டீனியரை தேர்ந்தெடுக்கவும்' : 'Select a Denier'}
                </p>
              </div>
            )}
          </div>
        )}

        {viewType === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setIsCreatingOrder(true)}
                className={`${buttonColor} text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition`}
              >
                <Plus size={16} /> {language === 'ta' ? 'புதிய வார்ப்பு ஆர்டர் உருவாக்கு' : 'Create New Warp Order'}
              </button>
            </div>
            
            {warperOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No orders available'}
                </p>
              </div>
            ) : (
              warperOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {order.orderNumber && (
                          <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-lg">
                            {order.orderNumber}
                          </span>
                        )}
                        <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2 py-1 rounded-lg">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-black text-gray-800 text-lg">{order.designName}</h4>
                      <p className="text-sm text-gray-500 font-medium">
                        {language === 'ta' ? 'தறிகாரர்:' : 'Weaver:'} {order.weaverName} 
                        {order.loomNumber !== '-' && ` (தறி ${order.loomNumber})`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleCompleteOrder(order.id)}
                          className="bg-emerald-100 text-emerald-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-200 transition"
                        >
                          {language === 'ta' ? 'ஓகே (தயார்)' : 'OK (Ready)'}
                        </button>
                      )}
                      {(order.loomId === 'STOCK' || order.loomId === 'UNASSIGNED') && (
                        <button 
                          onClick={() => {
                            setIsAssigningOrder(order.id);
                            const wId = order.weaverId === 'STOCK' ? '' : (order.weaverId || '');
                            setAssignWeaverId(wId);
                            setAssignWeaverSearch(wId ? (weavers.find(w => w.id === wId)?.name || '') : '');
                            setAssignLoomId('');
                          }}
                          className="bg-zinc-100 text-zinc-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 transition"
                        >
                          {language === 'ta' ? 'தறிக்கு மாற்று' : 'Assign to Loom'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'வார்ப்பு நூல்' : 'Warp Yarn'}</p>
                      <p className="font-bold text-gray-800">{order.warpYarnType}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'ஊடை நூல்' : 'Weft Yarn'}</p>
                      <p className="font-bold text-gray-800">{order.weftYarnType}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl col-span-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">{language === 'ta' ? 'அமைப்பு' : 'Structure'}</p>
                      <div className="flex flex-wrap gap-2">
                        {order.sections.map((sec, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <span className="text-gray-500">{sec.name}:</span>
                            <span className="font-bold">{sec.ends}</span>
                            {sec.color && <span className="text-xs text-zinc-600 ml-1">({sec.color})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த சேலை' : 'Total Sarees'}</p>
                      <p className="font-bold text-gray-800">{order.totalSareesExpected}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'வார்ப்பு (மீட்டர்)' : 'Warp (Meters)'}</p>
                      <p className="font-bold text-gray-800">{order.warpLengthMeters || '-'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewType === 'all-warps' && (
          <div className="space-y-4">
            {warperOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No orders available'}
                </p>
              </div>
            ) : (
              <>
                {/* Search and Filter */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={language === 'ta' ? 'ஐடி, தறிகாரர் பெயர் தேட...' : 'Search ID, Weaver...'}
                      value={warpSearchQuery}
                      onChange={(e) => setWarpSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    <button
                      onClick={() => setWarpWageFilter('ALL')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'ALL' ? `${buttonColor} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {language === 'ta' ? 'அனைத்தும்' : 'All'}
                    </button>
                    <button
                      onClick={() => setWarpWageFilter('PAID')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {language === 'ta' ? 'கூலி கொடுத்தது' : 'Fully Paid'}
                    </button>
                    <button
                      onClick={() => setWarpWageFilter('UNPAID')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'UNPAID' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      {language === 'ta' ? 'கூலி கொடுக்க வேண்டியது' : 'Unpaid'}
                    </button>
                    <button
                      onClick={() => setWarpWageFilter('PARTIAL')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'PARTIAL' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      {language === 'ta' ? 'பாதி கூலி கொடுத்தது' : 'Partially Paid'}
                    </button>
                  </div>
                </div>

                {/* Summary Section - Moved to Top */}
                <div className={`${buttonColor} text-white p-5 rounded-2xl shadow-lg mb-6`}>
                  <h4 className="font-bold mb-4 opacity-90">{language === 'ta' ? 'மொத்த கணக்குகள்' : 'Total Accounts'}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs opacity-70 mb-1">{language === 'ta' ? 'மொத்த கூலி' : 'Total Wage'}</p>
                      <p className="text-xl font-black">₹{filteredWarperOrders.reduce((sum, o) => sum + (o.wage || 0), 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-1">{language === 'ta' ? 'கொடுத்தது' : 'Total Paid'}</p>
                      <p className="text-xl font-black text-emerald-400">₹{filteredWarperOrders.reduce((sum, o) => sum + (o.wagePaid || 0), 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-1">{language === 'ta' ? 'மீதமுள்ள பாக்கி' : 'Total Balance'}</p>
                      <p className="text-xl font-black text-red-400">₹{filteredWarperOrders.reduce((sum, o) => sum + ((o.wage || 0) - (o.wagePaid || 0)), 0)}</p>
                    </div>
                  </div>
                </div>

                {filteredWarperOrders.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-bold text-sm">
                      {language === 'ta' ? 'தேடலுக்கு ஏற்ற முடிவுகள் இல்லை' : 'No results found'}
                    </p>
                  </div>
                ) : (
                  filteredWarperOrders.map(order => {
                  const isEditingWage = editingWages[order.id] !== undefined;
                  const wageState = editingWages[order.id] || { wage: order.wage?.toString() || '', wagePaid: order.wagePaid?.toString() || '' };
                  const balance = (order.wage || 0) - (order.wagePaid || 0);
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      {/* Summary View */}
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2 py-1 rounded-lg">
                              {language === 'ta' ? 'ஐடி:' : 'ID:'} {order.orderNumber || order.id.slice(-4)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">{language === 'ta' ? 'தறிகாரர்' : 'Weaver'}</p>
                              <p className="font-bold text-gray-800 text-sm">{order.weaverName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{language === 'ta' ? 'தறி எண்' : 'Loom No'}</p>
                              <p className="font-bold text-gray-800 text-sm">{order.loomNumber || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-gray-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                          <div className="mb-4">
                            <h4 className="font-black text-gray-800 text-lg mb-1">{order.designName}</h4>
                            <span className="text-gray-500 text-xs">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த சேலை' : 'Total Sarees'}</p>
                              <p className="font-bold text-gray-800">{order.totalSareesExpected}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'வார்ப்பு (மீட்டர்)' : 'Warp (Meters)'}</p>
                              <p className="font-bold text-gray-800">{order.warpLengthMeters || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த இழைகள்' : 'Total Ends'}</p>
                              <p className="font-bold text-gray-800">{order.totalEnds}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த எடை' : 'Total Weight'}</p>
                              <p className="font-bold text-gray-800">{(order.totalWeight || 0).toFixed(3)} kg</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{language === 'ta' ? 'நூல் விவரங்கள்' : 'Yarn Details'}</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-gray-500">{language === 'ta' ? 'பாவு:' : 'Warp:'}</span> <span className="font-bold">{order.warpYarnType}</span></div>
                              <div><span className="text-gray-500">{language === 'ta' ? 'ஊடை:' : 'Weft:'}</span> <span className="font-bold">{order.weftYarnType}</span></div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{language === 'ta' ? 'பிரிவுகள்' : 'Sections'}</h5>
                            <div className="space-y-2">
                              {order.sections.map((section, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PREDEFINED_COLORS.find(c => c.name === section.color)?.code || '#ccc' }} />
                                    <span className="font-bold">{section.color}</span>
                                  </div>
                                  <div className="text-gray-600">
                                    {section.ends} {language === 'ta' ? 'இழைகள்' : 'Ends'} • {(section.weight || 0).toFixed(3)} kg
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-4 mt-2">
                            <h5 className="text-sm font-bold text-gray-700 mb-3">{language === 'ta' ? 'கூலி விவரங்கள்' : 'Wage Details'}</h5>
                            
                            {isEditingWage ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">{language === 'ta' ? 'மொத்த கூலி (₹)' : 'Total Wage (₹)'}</label>
                                    <input 
                                      type="number" 
                                      value={wageState.wage}
                                      onChange={e => setEditingWages({...editingWages, [order.id]: {...wageState, wage: e.target.value}})}
                                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-zinc-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">{language === 'ta' ? 'கொடுத்த கூலி (₹)' : 'Wage Paid (₹)'}</label>
                                    <input 
                                      type="number" 
                                      value={wageState.wagePaid}
                                      onChange={e => setEditingWages({...editingWages, [order.id]: {...wageState, wagePaid: e.target.value}})}
                                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-zinc-400"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const newEditing = {...editingWages};
                                      delete newEditing[order.id];
                                      setEditingWages(newEditing);
                                    }}
                                    className="flex-1 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg text-sm hover:bg-gray-50"
                                  >
                                    {language === 'ta' ? 'ரத்து' : 'Cancel'}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      handleUpdateWage(order.id);
                                      const newEditing = {...editingWages};
                                      delete newEditing[order.id];
                                      setEditingWages(newEditing);
                                    }}
                                    className={`flex-1 py-2 ${buttonColor} text-white font-bold rounded-lg text-sm`}
                                  >
                                    {language === 'ta' ? 'சேமி' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-[10px] text-gray-500">{language === 'ta' ? 'மொத்த கூலி' : 'Total Wage'}</p>
                                    <p className="font-bold text-gray-700">₹{order.wage || 0}</p>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-[10px] text-gray-500">{language === 'ta' ? 'கொடுத்தது' : 'Paid'}</p>
                                    <p className="font-bold text-green-600">₹{order.wagePaid || 0}</p>
                                  </div>
                                  <div className={`p-2 rounded-lg text-center ${balance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    <p className={`text-[10px] ${balance > 0 ? 'text-red-500' : 'text-gray-500'}`}>{language === 'ta' ? 'பாக்கி' : 'Balance'}</p>
                                    <p className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>₹{balance}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setEditingWages({...editingWages, [order.id]: { wage: order.wage?.toString() || '', wagePaid: order.wagePaid?.toString() || '' }})}
                                  className="w-full py-2 border border-zinc-200 text-zinc-600 font-bold rounded-lg text-sm hover:bg-zinc-50 transition"
                                >
                                  {language === 'ta' ? 'கூலியை திருத்து' : 'Edit Wage'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }))}
              </>
            )}
          </div>
        )}

        {viewType === 'balance' && (
          <div className="space-y-4">
            {warperBalances.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'கணக்குகள் எதுவும் இல்லை' : 'No balances available'}
                </p>
              </div>
            ) : (
              Object.entries(
                warperBalances.reduce((acc, item) => {
                  if (!acc[item.yarnType]) acc[item.yarnType] = [];
                  acc[item.yarnType].push(item);
                  return acc;
                }, {} as Record<string, typeof warperBalances>)
              ).map(([yarnType, items]) => (
                <div key={yarnType} className="mb-8">
                  <h3 className="text-sm font-black text-gray-500 mb-3 uppercase tracking-wider">
                    {yarnType !== 'Unknown' ? yarnType : (language === 'ta' ? 'டீனியர் இல்லை' : 'No Denier')}
                  </h3>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-zinc-500"></div>
                            <h4 className="font-black text-gray-800 text-lg">{item.color}</h4>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${item.balance > 0 ? 'bg-emerald-100 text-emerald-700' : item.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {language === 'ta' ? 'மீதம்: ' : 'Bal: '}{item.balance.toFixed(2)} kg
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-50 p-3 rounded-xl">
                            <p className="text-xs text-zinc-600 font-bold mb-1">{language === 'ta' ? 'கொடுத்தது' : 'Given'}</p>
                            <p className="font-black text-zinc-900 text-lg">{item.received.toFixed(2)} kg</p>
                          </div>
                          <div className="bg-emerald-50 p-3 rounded-xl">
                            <p className="text-xs text-emerald-600 font-bold mb-1">{language === 'ta' ? 'வந்தது' : 'Returned'}</p>
                            <p className="font-black text-emerald-900 text-lg">{item.returned.toFixed(2)} kg</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewType === 'received' && (
          <div className="space-y-3">
            {warperDispatches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowDownLeft size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'நூல் எதுவும் கொடுக்கவில்லை' : 'No yarn given yet'}
                </p>
              </div>
            ) : (
              warperDispatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(dispatch => (
                <div key={dispatch.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2 py-1 rounded-lg">
                      {new Date(dispatch.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'நூல்' : 'Yarn'}</p>
                      <p className="font-bold text-gray-800">{dispatch.yarnType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'கிலோ' : 'Weight'}</p>
                      <p className="font-bold text-gray-800">{dispatch.weightKg} kg</p>
                    </div>
                    {dispatch.color && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'கலர்' : 'Color'}</p>
                        <p className="font-bold text-gray-800">{dispatch.color}</p>
                      </div>
                    )}
                    {dispatch.supplierName && (
                      <div className="col-span-2 mt-1 pt-2 border-t border-gray-50">
                        <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'சப்ளையர்' : 'Supplier'}</p>
                        <p className="font-bold text-gray-800">
                          {dispatch.supplierName} {dispatch.billNumber ? `(Bill: ${dispatch.billNumber})` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewType === 'returned' && (
          <>
            {warperReturns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'வரவுகள் எதுவும் இல்லை' : 'No returns yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {warperReturns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(ret => (
                  <div key={ret.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg">
                          {new Date(ret.date).toLocaleDateString()}
                        </div>
                        {ret.warpNumber && (
                          <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-lg">
                            {language === 'ta' ? 'வ.எண்:' : 'S.No:'} {ret.warpNumber}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteReturn(ret.id)} 
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'கலர்' : 'Color'}</p>
                        <p className="font-bold text-gray-800">{ret.color}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'கிலோ' : 'Weight'}</p>
                        <p className="font-bold text-gray-800">{ret.weightKg} kg</p>
                      </div>
                      {ret.yarnType && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'டீனியர்' : 'Denier'}</p>
                          <p className="font-bold text-gray-800">{ret.yarnType}</p>
                        </div>
                      )}
                      {ret.ends && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'இழை' : 'Ends'}</p>
                          <p className="font-bold text-gray-800">{ret.ends}</p>
                        </div>
                      )}
                      {ret.weaverName && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'தறிகாரர்' : 'Weaver'}</p>
                          <p className="font-bold text-gray-800">{ret.weaverName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      {isAssigningOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'தறிக்கு மாற்று' : 'Assign to Loom'}</h3>
            
            <div className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={assignWeaverSearch}
                  onChange={(e) => {
                    setAssignWeaverSearch(e.target.value);
                    const existing = weavers.find(w => w.name.toLowerCase() === e.target.value.toLowerCase());
                    if (existing) {
                      setAssignWeaverId(existing.id);
                    } else {
                      setAssignWeaverId('');
                    }
                    setAssignLoomId('');
                  }}
                  onFocus={() => setShowWeaverDropdown(true)}
                  onBlur={() => setTimeout(() => setShowWeaverDropdown(false), 200)}
                  placeholder={language === 'ta' ? 'தறிக்காரர் பெயர் (தேட அல்லது புதிதாக சேர்க்க)' : 'Weaver Name (Search or Add New)'}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
                {showWeaverDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
                    {weavers.filter(w => w.name.toLowerCase().includes(assignWeaverSearch.toLowerCase())).map(w => (
                      <div
                        key={w.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer font-bold text-sm"
                        onClick={() => {
                          setAssignWeaverId(w.id);
                          setAssignWeaverSearch(w.name);
                          setShowWeaverDropdown(false);
                        }}
                      >
                        {w.name}
                      </div>
                    ))}
                    {assignWeaverSearch.trim() && !weavers.some(w => w.name.toLowerCase() === assignWeaverSearch.trim().toLowerCase()) && (
                      <div
                        className="p-3 hover:bg-gray-50 cursor-pointer font-bold text-sm text-blue-600"
                        onClick={() => {
                          setAssignWeaverId('');
                          setShowWeaverDropdown(false);
                        }}
                      >
                        + {language === 'ta' ? `புதிய தறிக்காரர்: "${assignWeaverSearch}"` : `Add New: "${assignWeaverSearch}"`}
                      </div>
                    )}
                    {!assignWeaverSearch.trim() && weavers.length === 0 && (
                      <div className="p-3 text-gray-400 text-sm text-center">
                        {language === 'ta' ? 'தறிக்காரர்கள் இல்லை' : 'No weavers found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <select 
                value={assignLoomId}
                onChange={e => setAssignLoomId(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                disabled={!assignWeaverId && !assignWeaverSearch.trim()}
              >
                <option value="">{language === 'ta' ? '-- தறியை தேர்ந்தெடுக்கவும் (விருப்பப்பட்டால்) --' : '-- Select Loom (Optional) --'}</option>
                {looms.filter(l => l.weaverId === assignWeaverId).map(l => (
                  <option key={l.id} value={l.id}>{language === 'ta' ? 'தறி' : 'Loom'} {l.loomNumber} {l.designName ? `- ${l.designName}` : ''}</option>
                ))}
                <option value="ADD_NEW" className="text-zinc-600 font-black">+ {language === 'ta' ? 'புதிய தறி' : 'Add New Loom'}</option>
              </select>

              {assignLoomId === 'ADD_NEW' && (
                <div className="flex gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                  <select
                    value={newLoomNumber}
                    onChange={(e) => setNewLoomNumber(e.target.value)}
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                  >
                    <option value="" disabled>{language === 'ta' ? 'எண்' : 'Number'}</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  
                  <select
                    value={newLoomBreak}
                    onChange={(e) => setNewLoomBreak(e.target.value)}
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                  >
                    <option value="Right Break">{language === 'ta' ? 'ரைட் பிரேக்' : 'Right Break'}</option>
                    <option value="Left Break">{language === 'ta' ? 'லெஃப்ட் பிரேக்' : 'Left Break'}</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsAssigningOrder(null);
                  setAssignWeaverId('');
                  setAssignWeaverSearch('');
                  setAssignLoomId('');
                  setNewLoomNumber('1');
                  setNewLoomBreak('Right Break');
                }} 
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button 
                onClick={handleAssignOrder} 
                className={`flex-1 py-4 ${buttonColor} text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200`}
              >
                {language === 'ta' ? 'மாற்று' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreatingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'புதிய வார்ப்பு ஆர்டர்' : 'New Warp Order'}</h3>
            
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'டிசைன் பெயர்' : 'Design Name'}
                value={orderDesignName}
                onChange={e => setOrderDesignName(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={orderWarpYarnType}
                  onChange={e => setOrderWarpYarnType(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                >
                  <option value="">{language === 'ta' ? 'வார்ப்பு நூல்' : 'Warp Yarn'}</option>
                  {YARN_TYPES.map((type, idx) => (
                    <option key={`warp-${idx}`} value={type}>{type}</option>
                  ))}
                </select>
                <select 
                  value={orderWeftYarnType}
                  onChange={e => setOrderWeftYarnType(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                >
                  <option value="">{language === 'ta' ? 'ஊடை நூல்' : 'Weft Yarn'}</option>
                  {YARN_TYPES.map((type, idx) => (
                    <option key={`weft-${idx}`} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-3">{language === 'ta' ? 'வார்ப்பு அமைப்பு' : 'Warp Structure'}</p>
                <div className="space-y-2">
                  {orderSections.map((section, index) => (
                    <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100">
                      <select 
                        value={section.name}
                        onChange={e => handleOrderSectionChange(index, 'name', e.target.value)}
                        className="w-24 flex-none p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                      >
                        <option value="">{language === 'ta' ? 'தேர்வு செய்' : 'Select'}</option>
                        <option value={language === 'ta' ? 'உடல்' : 'Body'}>{language === 'ta' ? 'உடல்' : 'Body'}</option>
                        <option value={language === 'ta' ? 'ரைட் பார்டர்' : 'Right Border'}>{language === 'ta' ? 'ரைட் பார்டர்' : 'Right Border'}</option>
                        <option value={language === 'ta' ? 'லெப்ட் பார்டர்' : 'Left Border'}>{language === 'ta' ? 'லெப்ட் பார்டர்' : 'Left Border'}</option>
                        <option value={language === 'ta' ? 'பிளைன் வார்ப்பு' : 'Plain Warp'}>{language === 'ta' ? 'பிளைன் வார்ப்பு' : 'Plain Warp'}</option>
                      </select>
                      <input 
                        type="number" 
                        placeholder={language === 'ta' ? 'இழை' : 'Ends'}
                        value={section.ends || ''}
                        onChange={e => handleOrderSectionChange(index, 'ends', parseInt(e.target.value) || 0)}
                        className="w-16 flex-none p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                      />
                      <select 
                        value={section.color || ''}
                        onChange={e => handleOrderSectionChange(index, 'color', e.target.value)}
                        className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                      >
                        <option value="">{language === 'ta' ? 'கலர்' : 'Color'}</option>
                        {YARN_COLORS.map((color, idx) => (
                          <option key={`color-${idx}`} value={color}>{color}</option>
                        ))}
                      </select>
                      {orderSections.length > 1 && (
                        <button onClick={() => removeOrderSection(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    onClick={addOrderSection}
                    className="w-full py-2 mt-2 border border-dashed border-zinc-300 text-zinc-600 rounded-lg text-xs font-bold hover:bg-zinc-50 transition"
                  >
                    + {language === 'ta' ? 'மேலும் சேர்க்க' : 'Add More'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'மொத்த சேலை' : 'Total Sarees'}
                  value={orderTotalSarees}
                  onChange={e => setOrderTotalSarees(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'வார்ப்பு (மீட்டர்)' : 'Warp Length (m)'}
                  value={orderWarpLength}
                  onChange={e => setOrderWarpLength(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 mb-1">
                  {language === 'ta' ? 'கணக்கிடப்பட்ட எடை (Kg)' : 'Calculated Weight (Kg)'}
                </p>
                <p className="text-2xl font-black text-emerald-900">
                  {calculatedOrderWeight}
                </p>
              </div>
              
              <input 
                type="number" 
                placeholder={language === 'ta' ? 'மொத்த நூல் எடை (kg)' : 'Total Yarn Weight (kg)'}
                value={orderTotalWeight || calculatedOrderWeight}
                onChange={e => setOrderWarpWeight(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setIsCreatingOrder(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button onClick={handleCreateOrder} className={`flex-1 py-4 ${buttonColor} text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200`}>
                {language === 'ta' ? 'உருவாக்கு' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'வரவு' : 'Return'}</h3>
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'ஆர்டர் ஐடி' : 'Order ID'}
                value={returnOrderId}
                onChange={e => {
                  const val = e.target.value;
                  setReturnOrderId(val);
                  const order = warpOrders.find(o => o.id === val || o.orderNumber === val);
                  if (order) {
                    setReturnDesignName(order.designName || '');
                    setReturnEnds(order.totalEnds.toString());
                    setReturnLength(order.warpLengthMeters?.toString() || '1000');
                    if (order.weaverId && order.weaverId !== 'STOCK') {
                      setReturnWeaverId(order.weaverId);
                    }
                    if (order.warpYarnType) {
                      setReturnDenier(order.warpYarnType);
                    }
                  }
                }}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              />
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'டிசைன் பெயர்' : 'Design Name'}
                value={returnDesignName}
                onChange={e => setReturnDesignName(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              />
              <select 
                value={returnDenier}
                onChange={e => setReturnDenier(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- டீனியர் --' : '-- Denier --'}</option>
                {denierFormulas.map(f => (
                  <option key={f.id} value={f.denier}>{f.denier}</option>
                ))}
              </select>
              <select 
                value={returnWeaverId}
                onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const name = window.prompt(language === 'ta' ? 'புதிய தறிகாரர் பெயர்:' : 'New Weaver Name:');
                    if (name) {
                      const newWeaver: Weaver = { id: Date.now().toString(), name, createdAt: Date.now() };
                      const updated = [...weavers, newWeaver];
                      setWeavers(updated);
                      localStorage.setItem(`viyabaari_weavers_${user.uid || 'guest'}`, JSON.stringify(updated));
                      setReturnWeaverId(newWeaver.id);
                    }
                  } else {
                    setReturnWeaverId(e.target.value);
                  }
                }}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- தறிகாரர் --' : '-- Weaver --'}</option>
                {weavers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
                <option value="ADD_NEW" className="text-zinc-600 font-black">+ {language === 'ta' ? 'புதிய தறிகாரர்' : 'Add New Weaver'}</option>
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'இழை (Ends)' : 'Ends'}
                  value={returnEnds}
                  onChange={e => setReturnEnds(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
                />
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'நீளம் (m)' : 'Length (m)'}
                  value={returnLength}
                  onChange={e => setReturnLength(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
                />
                <input 
                  type="number" 
                  step="0.01"
                  placeholder={language === 'ta' ? 'எடை (Kg)' : 'Weight (Kg)'}
                  value={returnWeight}
                  onChange={e => setReturnWeight(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
                />
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 mb-1">
                  {language === 'ta' ? 'கணக்கிடப்பட்ட எடை (Kg)' : 'Calculated Weight (Kg)'}
                </p>
                <p className="text-2xl font-black text-emerald-900">
                  {calculatedReturnWeight}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                {language === 'ta' ? 'இழை கொடுத்தால் எடை தானாக கணக்கிடப்படும் (ஃபார்முலா இருந்தால்)' : 'Weight auto-calculated from ends if formula exists'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsAddingReturn(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button onClick={handleAddReturn} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200">
                {language === 'ta' ? 'சேமி' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingDetail && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 text-xl tamil-font">
                {viewingDetail.type === 'dispatch' ? (language === 'ta' ? 'நூல் வரவு விவரம்' : 'Yarn Given Details') : 
                 viewingDetail.type === 'order' ? (language === 'ta' ? 'வார்ப்பு ஆர்டர் விவரம்' : 'Warp Order Details') :
                 (language === 'ta' ? 'வரவு விவரம்' : 'Return Details')}
              </h3>
              <button 
                onClick={() => setViewingDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Plus size={24} className="rotate-45 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {viewingDetail.type === 'dispatch' && (
                <>
                  <DetailItem label={language === 'ta' ? 'தேதி' : 'Date'} value={new Date(viewingDetail.data.date).toLocaleDateString()} />
                  <DetailItem label={language === 'ta' ? 'நூல் வகை' : 'Yarn Type'} value={viewingDetail.data.yarnType} />
                  <DetailItem label={language === 'ta' ? 'கலர்' : 'Color'} value={viewingDetail.data.color} />
                  <DetailItem label={language === 'ta' ? 'எடை (kg)' : 'Weight (kg)'} value={viewingDetail.data.weightKg.toFixed(2)} />
                  <DetailItem label={language === 'ta' ? 'சப்ளையர்' : 'Supplier'} value={suppliers.find(s => s.id === viewingDetail.data.supplierId)?.name || '-'} />
                  <DetailItem label={language === 'ta' ? 'பில் எண்' : 'Bill No'} value={viewingDetail.data.billNumber || '-'} />
                </>
              )}

              {viewingDetail.type === 'order' && (
                <>
                  <DetailItem label={language === 'ta' ? 'ஆர்டர் எண்' : 'Order No'} value={viewingDetail.data.orderNumber} />
                  <DetailItem label={language === 'ta' ? 'தேதி' : 'Date'} value={new Date(viewingDetail.data.date).toLocaleDateString()} />
                  <DetailItem label={language === 'ta' ? 'டிசைன்' : 'Design'} value={viewingDetail.data.designName} />
                  <DetailItem label={language === 'ta' ? 'வார்ப்பு நூல்' : 'Warp Yarn'} value={viewingDetail.data.warpYarnType} />
                  <DetailItem label={language === 'ta' ? 'ஊடை நூல்' : 'Weft Yarn'} value={viewingDetail.data.weftYarnType} />
                  <DetailItem label={language === 'ta' ? 'மொத்த இழை' : 'Total Ends'} value={viewingDetail.data.totalEnds} />
                  <DetailItem label={language === 'ta' ? 'மொத்த நீளம்' : 'Total Length'} value={viewingDetail.data.totalLength} />
                  <DetailItem label={language === 'ta' ? 'எதிர்பார்க்கும் சேலைகள்' : 'Expected Sarees'} value={viewingDetail.data.totalSareesExpected} />
                  <DetailItem label={language === 'ta' ? 'தறிகாரர்' : 'Weaver'} value={viewingDetail.data.weaverName} />
                  <DetailItem label={language === 'ta' ? 'தறி எண்' : 'Loom No'} value={viewingDetail.data.loomNumber} />
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {language === 'ta' ? 'பிரிவுகள்' : 'Sections'}
                    </p>
                    <div className="space-y-2">
                      {viewingDetail.data.sections.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium">{s.name} ({s.color})</span>
                          <span className="font-bold">{s.ends} {language === 'ta' ? 'இழை' : 'Ends'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {viewingDetail.type === 'return' && (
                <>
                  <DetailItem label={language === 'ta' ? 'தேதி' : 'Date'} value={new Date(viewingDetail.data.date).toLocaleDateString()} />
                  <DetailItem label={language === 'ta' ? 'கலர்' : 'Color'} value={viewingDetail.data.color} />
                  <DetailItem label={language === 'ta' ? 'எடை (kg)' : 'Weight (kg)'} value={viewingDetail.data.weightKg.toFixed(2)} />
                  <DetailItem label={language === 'ta' ? 'நூல் வகை' : 'Yarn Type'} value={viewingDetail.data.yarnType} />
                  <DetailItem label={language === 'ta' ? 'தறிகாரர்' : 'Weaver'} value={viewingDetail.data.weaverName || '-'} />
                  <DetailItem label={language === 'ta' ? 'இழை' : 'Ends'} value={viewingDetail.data.ends || '-'} />
                  <DetailItem label={language === 'ta' ? 'நீளம்' : 'Length'} value={viewingDetail.data.length || '-'} />
                </>
              )}
            </div>

            <button 
              onClick={() => setViewingDetail(null)}
              className="w-full mt-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
            >
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {isAddingDispatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'நூல் வரவு' : 'Yarn Given'}</h3>
            <div className="space-y-4 mb-6">
              <input 
                type="date" 
                value={dispatchDate}
                onChange={e => setDispatchDate(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
              <select 
                value={dispatchDenier}
                onChange={e => setDispatchDenier(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- டீனியர் --' : '-- Denier --'}</option>
                {denierFormulas.map(f => (
                  <option key={f.id} value={f.denier}>{f.denier}</option>
                ))}
              </select>
              <select 
                value={dispatchColor}
                onChange={e => setDispatchColor(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- கலர் --' : '-- Color --'}</option>
                {YARN_COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                value={dispatchSupplierId}
                onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const name = window.prompt(language === 'ta' ? 'புதிய சப்ளையர் பெயர்:' : 'New Supplier Name:');
                    if (name) {
                      const newSupplier: Supplier = { id: Date.now().toString(), name, createdAt: Date.now() };
                      const updated = [...suppliers, newSupplier];
                      setSuppliers(updated);
                      localStorage.setItem(`viyabaari_suppliers_${user.uid || 'guest'}`, JSON.stringify(updated));
                      setDispatchSupplierId(newSupplier.id);
                    }
                  } else {
                    setDispatchSupplierId(e.target.value);
                  }
                }}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- சப்ளையர் --' : '-- Supplier --'}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="ADD_NEW" className="text-zinc-600 font-black">+ {language === 'ta' ? 'புதிய சப்ளையர்' : 'Add New Supplier'}</option>
              </select>
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'பில் நம்பர்' : 'Bill Number'}
                value={dispatchBillNumber}
                onChange={e => setDispatchBillNumber(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
              <input 
                type="number" 
                step="0.01"
                placeholder={language === 'ta' ? 'எடை (Kg)' : 'Weight (Kg)'}
                value={dispatchWeight}
                onChange={e => setDispatchWeight(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsAddingDispatch(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button onClick={handleAddDispatch} className={`flex-1 py-4 ${buttonColor} text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200`}>
                {language === 'ta' ? 'சேமி' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagingFormulas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'டீனியர் ஃபார்முலா' : 'Denier Formulas'}</h3>
            
            <div className="space-y-3 mb-6">
              {denierFormulas.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">{f.denier}</p>
                    <p className="text-xs text-gray-500">1 {language === 'ta' ? 'இழை' : 'End'} = {f.gramsPerEnd ? `${f.gramsPerEnd} g` : `${f.multiplier} kg`}</p>
                  </div>
                  <button 
                    onClick={() => saveFormulas(denierFormulas.filter(df => df.id !== f.id))}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {denierFormulas.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4">{language === 'ta' ? 'ஃபார்முலா எதுவும் இல்லை' : 'No formulas added'}</p>
              )}
            </div>

            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
              <h4 className="text-xs font-bold text-zinc-800 mb-3">{language === 'ta' ? 'புதிய ஃபார்முலா சேர்' : 'Add New Formula'}</h4>
              <div className="space-y-3">
                <select
                  value={isCustomDenier ? 'other' : (YARN_TYPES.includes(newFormulaDenier) ? newFormulaDenier : (newFormulaDenier ? 'other' : ''))}
                  onChange={e => {
                    if (e.target.value === 'other') {
                      setIsCustomDenier(true);
                      setNewFormulaDenier('');
                    } else {
                      setIsCustomDenier(false);
                      setNewFormulaDenier(e.target.value);
                    }
                  }}
                  className="w-full p-3 bg-white border border-zinc-100 rounded-xl text-sm outline-none focus:border-zinc-400 font-medium"
                >
                  <option value="">{language === 'ta' ? '-- டீனியர் தேர்ந்தெடுக்கவும் --' : '-- Select Denier --'}</option>
                  {YARN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="other">{language === 'ta' ? 'மற்றவை (Type Custom)' : 'Other (Type Custom)'}</option>
                </select>
                
                {isCustomDenier && (
                  <input 
                    type="text" 
                    placeholder={language === 'ta' ? 'டீனியர் பெயர் (உ.ம்: 50 Denier)' : 'Denier Name (e.g., 50 Denier)'}
                    value={newFormulaDenier}
                    onChange={e => setNewFormulaDenier(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-100 rounded-xl text-sm outline-none focus:border-zinc-400 animate-in fade-in slide-in-from-top-2"
                  />
                )}
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder={language === 'ta' ? '1 இழைக்கு எத்தனை கிராம்?' : 'Grams per 1 End?'}
                  value={newFormulaMultiplier}
                  onChange={e => setNewFormulaMultiplier(e.target.value)}
                  className="w-full p-3 bg-white border border-zinc-100 rounded-xl text-sm outline-none focus:border-zinc-400"
                />
                <button 
                  onClick={handleAddFormula}
                  className={`w-full py-3 ${buttonColor} text-white rounded-xl font-bold text-sm shadow-md`}
                >
                  {language === 'ta' ? 'சேர்' : 'Add'}
                </button>
              </div>
            </div>

            <button onClick={() => setIsManagingFormulas(false)} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}

      </div>
    );
  }

  // Render Warpers List View
  return (
    <div className="p-4 pb-24 md:pb-4 md:max-w-none mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black tamil-font text-gray-800">
            {language === 'ta' ? 'வார்ப்பு கணக்குகள்' : 'Warp Accounts'}
          </h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className={`${buttonColor} text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-md transition`}
        >
          <Plus size={14} /> {language === 'ta' ? 'புதிய கடையை சேர்+' : 'Add New Shop+'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-3xl shadow-lg border border-zinc-100 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-black text-gray-800 mb-4 tamil-font text-lg">{language === 'ta' ? 'புதிய கடை' : 'New Shop'}</h3>
          <input 
            type="text" 
            placeholder={language === 'ta' ? 'பெயர்' : 'Name'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl mb-3 outline-none border border-gray-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition font-medium"
          />
          <input 
            type="text" 
            placeholder={language === 'ta' ? 'போன் நம்பர் (விருப்பப்பட்டால்)' : 'Phone (Optional)'}
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl mb-5 outline-none border border-gray-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition font-medium"
          />
          <div className="flex gap-3">
            <button onClick={handleAdd} className={`flex-1 ${buttonColor} text-white py-3.5 rounded-2xl font-black shadow-md shadow-zinc-200 hover:shadow-lg transition`}>
              {language === 'ta' ? 'சேமி' : 'Save'}
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-black hover:bg-gray-200 transition">
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {warpers.length === 0 && !isAdding ? (
        <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-zinc-300" />
          </div>
          <p className="text-gray-500 font-bold tamil-font text-lg">
            {language === 'ta' ? 'கடைகள் யாரும் இல்லை' : 'No shops added yet'}
          </p>
          <p className="text-gray-400 text-sm mt-2 max-w-[200px] mx-auto">
            {language === 'ta' ? 'மேலே உள்ள பட்டனை தட்டி கடையை சேர்க்கவும்' : 'Tap the button above to add a new shop'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warpers.map((warper, index) => {
            const WARPER_COLORS = [
              'bg-blue-600 hover:bg-blue-700',
              'bg-emerald-600 hover:bg-emerald-700',
              'bg-purple-600 hover:bg-purple-700',
              'bg-amber-600 hover:bg-amber-700',
              'bg-rose-600 hover:bg-rose-700',
              'bg-cyan-600 hover:bg-cyan-700',
              'bg-indigo-600 hover:bg-indigo-700',
              'bg-teal-600 hover:bg-teal-700',
            ];
            const colorClass = WARPER_COLORS[index % WARPER_COLORS.length];
            return (
            <div 
              key={warper.id} 
              onClick={() => { setSelectedWarper(warper); setLedgerPage(1); setStatementPage(1); }}
              className={`${colorClass} p-4 rounded-2xl shadow-sm flex items-center justify-between transition cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center font-black text-xl shadow-inner">
                  {warper.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-white text-lg">{warper.name}</h4>
                  {warper.phone && <p className="text-xs font-bold text-white/80 mt-0.5">{warper.phone}</p>}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(warper.id); }} 
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )})}
        </div>
      )}
      {isScanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-lg font-bold">{scanStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warpers;
