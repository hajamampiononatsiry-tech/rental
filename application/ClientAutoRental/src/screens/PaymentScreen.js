import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function PaymentScreen({ route, navigation, onBack, onSuccess }) {
  const context = useContext(ThemeContext) || {};
  const theme = context.theme || { bg: '#0f172a', cardBg: '#1e293b', text: '#fff', subText: '#94a3b8', border: '#334155', accent: '#eab308' };
  const t = context.t || {};
  const isDarkMode = context.isDarkMode ?? true;

  const translate = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    if (typeof t === 'object' && t !== null && typeof t[key] === 'string') {
      return t[key];
    }
    return fallback;
  };

  const [invoicesList, setInvoicesList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(route.params?.invoice || route.params?.facture || route.params?.item || null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastMessage(''));
    }, 3500);
  };

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [depositPin, setDepositPin] = useState('');

  const [selectedMethod, setSelectedMethod] = useState('mvola');
  const [amountToPay, setAmountToPay] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
    if (selectedInvoice) {
      const total = parseFloat(selectedInvoice.montant_total || selectedInvoice.total || 0);
      const alreadyPaid = parseFloat(selectedInvoice.montant_paye || 0);
      const remaining = selectedInvoice.reste_a_payer !== undefined ? parseFloat(selectedInvoice.reste_a_payer) : (total - alreadyPaid);
      
      setAmountToPay(String(remaining > 0 ? remaining : total));
    } else {
      fetchPendingInvoices(false);
    }

    const intervalId = setInterval(() => {
      loadSilentBalance();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [selectedInvoice]);

  const loadInitialData = async () => {
    try {
      const cachedUser = await AsyncStorage.getItem('user_data');
      let userEmail = '';
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        userEmail = parsedUser.email || '';
      }
      if (!userEmail) {
        userEmail = 'ainakely811@gmail.com';
      }
      await loadSilentBalance(userEmail);
    } catch (e) {
      console.log("Erreur chargement initial :", e);
    }
  };

  const loadSilentBalance = async (forcedEmail = '') => {
    try {
      let userEmail = forcedEmail;
      if (!userEmail) {
        const cachedUser = await AsyncStorage.getItem('user_data');
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          userEmail = parsedUser.email || '';
        }
      }
      if (!userEmail) {
        userEmail = 'ainakely811@gmail.com';
      }

      const endpoint = `accounts/me/?email=${encodeURIComponent(userEmail)}`;
      const res = await api.get(endpoint);
      
      if (res.data && res.data.solde_depot !== undefined) {
        const liveBalance = parseFloat(res.data.solde_depot || 0);
        setUserBalance(liveBalance);
        
        const userDataToSave = {
          email: res.data.email || userEmail,
          solde_depot: liveBalance,
          ...res.data
        };
        await AsyncStorage.setItem('user_data', JSON.stringify(userDataToSave));
      }
    } catch (e) {
      console.log("Erreur synchro silencieuse solde :", e);
    }
  };

  const fetchPendingInvoices = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const cachedUser = await AsyncStorage.getItem('user_data');
      let userEmail = cachedUser ? JSON.parse(cachedUser).email : 'ainakely811@gmail.com';

      const response = await api.get(`factures/?client_email=${encodeURIComponent(userEmail)}`);
      const list = response.data.results || response.data;
      const pending = list.filter(f => f.statut !== 'Payée');
      setInvoicesList(pending);
    } catch (error) {
      console.log("Erreur chargement factures :", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    if (!selectedInvoice) {
      await fetchPendingInvoices(false);
    }
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  const validatePhoneNumber = (phone, method = null) => {
    const cleaned = phone.replace(/\s+/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      return translate('phone_length_error', "Le numéro de téléphone doit contenir exactement 10 chiffres.");
    }

    const prefix = cleaned.slice(0, 3);

    if (method === 'mvola' && !['034', '038'].includes(prefix)) {
      return translate('mvola_prefix_error', "Pour MVola, le numéro doit commencer par 034 ou 038.");
    }
    if (method === 'airtel' && !['033', '036'].includes(prefix)) {
      return translate('airtel_prefix_error', "Pour Airtel, le numéro doit commencer par 033 ou 036.");
    }
    if (method === 'orange' && !['032', '037'].includes(prefix)) {
      return translate('orange_prefix_error', "Pour Orange, le numéro doit commencer par 032 ou 037.");
    }

    if (!['032', '033', '034', '036', '037', '038'].includes(prefix)) {
      return translate('invalid_prefix_error', "Préfixe opérateur invalide (valides: 032, 033, 034, 036, 037, 038).");
    }

    return null;
  };

  const handleBack = () => {
    if (selectedInvoice && !route.params?.invoice) {
      setSelectedInvoice(null);
    } else if (onBack) {
      onBack();
    } else if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('Catalogue');
    }
  };

  const handleDepositMoney = async () => {
    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount < 1000) {
      showToast(translate('min_deposit_error', "Le montant minimum pour un dépôt est de 1 000 AR."), "error");
      return;
    }
    
    const phoneError = validatePhoneNumber(depositPhone);
    if (phoneError) {
      showToast(phoneError, "error");
      return;
    }

    if (!depositPin || depositPin.length !== 4) {
      showToast(translate('pin_length_error', "Veuillez saisir un code PIN valide de 4 chiffres."), "error");
      return;
    }

    setIsProcessing(true);
    try {
      const cachedUser = await AsyncStorage.getItem('user_data');
      const parsedUser = cachedUser ? JSON.parse(cachedUser) : {};

      const response = await api.post('factures/depot_argent/', {
        montant: amount,
        telephone: depositPhone,
        code_secret_pin: depositPin,
        email: parsedUser.email || 'ainakely811@gmail.com'
      });

      setIsProcessing(false);
      const newBal = response.data.nouveau_solde !== undefined ? response.data.nouveau_solde : (userBalance + amount);
      setUserBalance(newBal);

      showToast(translate('deposit_success', `Dépôt de ${formatCurrency(amount)} AR effectué avec succès !`), "success");
      setDepositAmount('');
      setDepositPhone('');
      setDepositPin('');
      setShowDepositModal(false);
      await loadInitialData();
    } catch (error) {
      setIsProcessing(false);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || translate('deposit_fail', "Échec du dépôt. Vérifiez votre code PIN.");
      showToast(errorMsg, "error");
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    const newPaymentAmount = parseFloat(amountToPay);
    const totalInvoice = parseFloat(selectedInvoice.montant_total || selectedInvoice.total || 0);
    const alreadyPaid = parseFloat(selectedInvoice.montant_paye || 0);
    const remaining = selectedInvoice.reste_a_payer !== undefined ? parseFloat(selectedInvoice.reste_a_payer) : (totalInvoice - alreadyPaid);
    const cautionReq = parseFloat(selectedInvoice.montant_caution || selectedInvoice.caution || 0);

    if (isNaN(newPaymentAmount) || newPaymentAmount < 1000) {
      showToast(translate('min_payment_error', "Le versement minimum accepté est de 1 000 AR."), "error");
      return;
    }

    if (newPaymentAmount > remaining) {
      showToast(translate('max_payment_error', "Le versement ne peut pas dépasser le reste à payer."), "error");
      return;
    }

    if (alreadyPaid === 0 && cautionReq > 0 && newPaymentAmount < cautionReq) {
      showToast(translate('caution_error', `Le premier versement doit couvrir la caution (${formatCurrency(cautionReq)} AR).`), "error");
      return;
    }

    if (newPaymentAmount > userBalance) {
      showToast(translate('insufficient_balance', "Solde insuffisant."), "error");
      return;
    }

    if (selectedMethod !== 'caisse') {
      const phoneError = validatePhoneNumber(phoneNumber, selectedMethod);
      if (phoneError) {
        showToast(phoneError, "error");
        return;
      }
      if (!pinCode || pinCode.length !== 4) {
        showToast(translate('pin_length_error', "Veuillez saisir un code PIN valide de 4 chiffres."), "error");
        return;
      }
    }

    setIsProcessing(true);

    try {
      const totalPaidSoFar = alreadyPaid + newPaymentAmount;
      const newStatus = totalPaidSoFar >= totalInvoice ? 'Payée' : 'Partielle';

      const modeLabels = {
        mvola: 'MVola (Solde)',
        airtel: 'Airtel Money (Solde)',
        orange: 'Orange Money (Solde)',
        caisse: 'Espèces (Caisse)'
      };

      const cachedUser = await AsyncStorage.getItem('user_data');
      const parsedUser = cachedUser ? JSON.parse(cachedUser) : {};

      const paymentPayload = {
        montant_paye: totalPaidSoFar,
        statut: newStatus,
        mode_paiement: modeLabels[selectedMethod] || 'Solde',
        telephone_paiement: phoneNumber || '',
        reference_transaction: transactionRef || `TX-${selectedMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        code_secret_pin: pinCode,
        client_email: parsedUser.email || 'ainakely811@gmail.com'
      };

      const invoiceId = selectedInvoice.id || selectedInvoice.invoice_id || selectedInvoice.rawId;
      const response = await api.patch(`factures/${invoiceId}/`, paymentPayload);

      setIsProcessing(false);
      await loadInitialData();

      showToast(translate('payment_success', "Versement effectué avec succès !"), "success");

      if (onSuccess) {
        onSuccess(response.data);
      } else {
        setSelectedInvoice(null);
        fetchPendingInvoices(false);
      }
    } catch (error) {
      setIsProcessing(false);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || translate('payment_fail', "Échec du paiement.");
      showToast(errorMsg, "error");
    }
  };

  const headerBgColor = isDarkMode ? theme.cardBg : theme.accent;
  const headerTextColor = isDarkMode ? theme.text : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView 
        contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />}
      >
        <View style={[styles.header, { backgroundColor: headerBgColor }]}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{translate('back', '← Retour')}</Text>
            </TouchableOpacity>

            <View style={styles.balanceWidget}>
              <TouchableOpacity 
                style={[styles.plusButton, { backgroundColor: theme.accent }]} 
                onPress={() => setShowDepositModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.plusIcon}>＋</Text>
              </TouchableOpacity>
              <Text style={styles.balanceAmount}>{formatCurrency(userBalance)}</Text>
              <Text style={styles.currencyText}>AR</Text>
            </View>
          </View>

          <Text style={[styles.headerTitle, { color: headerTextColor }]}>{translate('wallet_invoices', 'Portefeuille & Factures')}</Text>
        </View>

        <Modal 
          visible={showDepositModal} 
          animationType="slide" 
          transparent={true}
          onRequestClose={() => setShowDepositModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{translate('reload_balance', 'Recharger mon solde AR')}</Text>
                <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                  <Text style={{ color: theme.subText, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>{translate('deposit_amount_label', 'Montant à recharger (AR, min 1 000)')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, fontWeight: 'bold', fontSize: 16 }]}
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="Ex: 50000"
                placeholderTextColor={theme.subText}
              />

              <Text style={[styles.label, { color: theme.text }]}>{translate('phone_number_label', 'Téléphone Mobile (032, 033, 034, 036, 037, 038)')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                placeholder="034 XX XXX XX"
                placeholderTextColor={theme.subText}
                keyboardType="phone-pad"
                value={depositPhone}
                onChangeText={setDepositPhone}
              />

              <Text style={[styles.label, { color: theme.text }]}>{translate('pin_label', 'Code PIN unique (4 chiffres)')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, letterSpacing: 4, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}
                placeholder="••••"
                placeholderTextColor={theme.subText}
                secureTextEntry
                maxLength={4}
                keyboardType="numeric"
                value={depositPin}
                onChangeText={setDepositPin}
              />

              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: theme.accent, marginTop: 10 }]}
                disabled={isProcessing}
                onPress={handleDepositMoney}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>
                    {translate('confirm_deposit', 'Confirmer le dépôt')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {!selectedInvoice ? (
          <View style={[styles.formSection, { padding: width * 0.04 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 15, marginBottom: 12 }]}>
              {translate('pending_invoices', 'Factures à régler :')}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30 }} />
            ) : invoicesList.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 30 }}>
                <Text style={{ color: theme.subText, textAlign: 'center' }}>{translate('no_pending_invoices', 'Aucune facture en attente.')}</Text>
              </View>
            ) : (
              <FlatList
                data={invoicesList}
                keyExtractor={(item) => String(item.id || item.rawId)}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const tot = parseFloat(item.montant_total || item.total || 0);
                  const paid = parseFloat(item.montant_paye || 0);
                  const rest = item.reste_a_payer !== undefined ? parseFloat(item.reste_a_payer) : (tot - paid);

                  return (
                    <TouchableOpacity 
                      style={[styles.invoiceCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      onPress={() => setSelectedInvoice(item)}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.invoiceRef, { color: theme.text }]}>{item.reference || `Facture #${item.id}`}</Text>
                        <Text style={{ color: theme.subText, fontSize: 12 }}>{translate('status', 'Statut')} : {item.statut || item.status}</Text>
                        <Text style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{translate('remaining', 'Reste')} : {formatCurrency(rest)} AR</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.invoiceAmount, { color: theme.accent }]}>{formatCurrency(tot)} AR</Text>
                        <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{translate('pay_action', 'Payer →')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        ) : (
          (() => {
            const invoiceTotal = parseFloat(selectedInvoice.montant_total || selectedInvoice.total || 0);
            const alreadyPaid = parseFloat(selectedInvoice.montant_paye || 0);
            const remainingAmount = selectedInvoice.reste_a_payer !== undefined ? parseFloat(selectedInvoice.reste_a_payer) : (invoiceTotal - alreadyPaid);
            const cautionReq = parseFloat(selectedInvoice.montant_caution || selectedInvoice.caution || 0);

            return (
              <View style={styles.formSection}>
                <View style={[styles.totalCard, { backgroundColor: isDarkMode ? theme.cardBg : '#EFF6FF', borderColor: theme.border, borderWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.subText, fontSize: 11 }}>Réf : {selectedInvoice.reference || selectedInvoice.id}</Text>
                    {cautionReq > 0 && alreadyPaid === 0 && (
                      <Text style={{ color: '#d97706', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                        {translate('caution_required', 'Caution requise')} : {formatCurrency(cautionReq)} AR
                      </Text>
                    )}
                    <Text style={[styles.totalAmount, { color: theme.accent, marginTop: 4 }]}>{translate('remaining_to_pay', 'Reste à payer')} : {formatCurrency(remainingAmount)} AR</Text>
                  </View>
                </View>

                <Text style={[styles.label, { color: theme.text, marginTop: 8 }]}>{translate('payment_amount_label', 'Montant du versement (AR, min 1 000)')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border, fontWeight: 'bold', fontSize: 16 }]}
                  keyboardType="numeric"
                  value={amountToPay}
                  onChangeText={setAmountToPay}
                  placeholder="Ex: 50000"
                  placeholderTextColor={theme.subText}
                />

                <Text style={[styles.sectionTitle, { color: theme.subText, marginTop: 10 }]}>{translate('payment_method', 'Mode de paiement')}</Text>
                <View style={styles.methodsGrid}>
                  {[
                    { id: 'mvola', label: 'MVola', sub: '034, 038', img: require('../../assets/images (2).jpg') },
                    { id: 'airtel', label: 'Airtel', sub: '033, 036', img: require('../../assets/images (3).jpg') },
                    { id: 'orange', label: 'Orange', sub: '032, 037', img: require('../../assets/images (1).png') },
                  ].map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      onPress={() => setSelectedMethod(method.id)}
                      style={[
                        styles.methodButton,
                        { backgroundColor: theme.cardBg, borderColor: theme.border },
                        selectedMethod === method.id && { borderColor: theme.accent, backgroundColor: isDarkMode ? '#1e293b' : '#EFF6FF' }
                      ]}
                    >
                      <Image source={method.img} style={styles.methodLogo} resizeMode="cover" />
                      <Text style={[
                        styles.methodText, 
                        { color: theme.subText },
                        selectedMethod === method.id && { color: theme.accent, fontWeight: 'bold' }
                      ]}>
                        {method.label}
                      </Text>
                      <Text style={{ fontSize: 9, color: theme.subText }}>{method.sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedMethod !== 'caisse' && (
                  <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {translate('phone_number_label', 'Numéro')} {selectedMethod.toUpperCase()} ({selectedMethod === 'mvola' ? '034, 038' : selectedMethod === 'airtel' ? '033, 036' : '032, 037'})
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                      placeholder={selectedMethod === 'mvola' ? "034 XX XXX XX" : selectedMethod === 'airtel' ? "033 XX XXX XX" : "032 XX XXX XX"}
                      placeholderTextColor={theme.subText}
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>{translate('pin_label', 'Code PIN unique (4 chiffres)')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, letterSpacing: 4, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}
                      placeholder="••••"
                      placeholderTextColor={theme.subText}
                      secureTextEntry
                      maxLength={4}
                      keyboardType="numeric"
                      value={pinCode}
                      onChangeText={setPinCode}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: theme.accent, marginTop: 10 }]}
                  disabled={isProcessing}
                  onPress={handlePayment}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>
                      {translate('validate_payment', 'Valider le versement')} de {formatCurrency(amountToPay)} AR
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })()
        )}
      </ScrollView>

      {toastMessage ? (
        <Animated.View style={[
          styles.toastContainer, 
          { 
            opacity: fadeAnim, 
            backgroundColor: toastType === 'error' ? '#ef4444' : '#16a34a' 
          }
        ]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 110 },
  header: { padding: isSmallDevice ? 14 : 20, paddingTop: 36, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { paddingVertical: 4 },
  
  balanceWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  plusButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  plusIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -2
  },
  balanceAmount: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 4
  },
  currencyText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700'
  },

  headerTitle: { fontSize: isSmallDevice ? 16 : 18, fontWeight: 'bold' },
  formSection: { padding: width * 0.04 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 },
  methodsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  methodButton: { flex: 1, marginHorizontal: 3, padding: isSmallDevice ? 8 : 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  methodLogo: { width: 28, height: 28, borderRadius: 6, marginBottom: 4 },
  methodText: { fontSize: 10, textAlign: 'center', fontWeight: '600' },
  inputContainer: { padding: isSmallDevice ? 12 : 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: isSmallDevice ? 9 : 11, fontSize: 14, marginBottom: 12 },
  payButton: { padding: isSmallDevice ? 14 : 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  payButtonText: { fontSize: 14, fontWeight: 'bold' },
  invoiceCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceRef: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  invoiceAmount: { fontSize: 15, fontWeight: 'bold' },
  totalCard: { padding: 14, borderRadius: 14, marginBottom: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold' },

  toastContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  }
});