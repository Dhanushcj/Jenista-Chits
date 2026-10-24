import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../store/AuthContext';
import { DataSyncManager } from '../../services/dataSync';
import { formatCurrency } from '../../utils/format';
import { CustomerChit } from '../../types';

export const CustomerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [customerRecord, setCustomerRecord] = useState<any>(null);
  const [chits, setChits] = useState<CustomerChit[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);
  const [companyBank, setCompanyBank] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCustomerProfile = async () => {
    try {
      if (!user) return;
      const [allCustomers, banks] = await Promise.all([
        DataSyncManager.getCustomers(),
        DataSyncManager.getBankAccounts(),
      ]);

      if (banks && banks.length > 0) {
        const defaultB = banks.find((b: any) => b.isDefault) || banks[0];
        setCompanyBank(defaultB);
      }

      const cleanUserPhone = (user.phone || user.mobile || user.id || '').replace(/\D/g, '');
      const found = allCustomers.find((c) => {
        const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '');
        return (
          c.id === user.id ||
          c.mongoId === user.id ||
          (cleanUserPhone && cPhone === cleanUserPhone)
        );
      });

      if (found) {
        setCustomerRecord(found);
        setTotalInvested(Number(found.totalPaid || 0));
        setPendingDues(Number(found.pending || 0));
        setChits(found.chits || []);
      } else {
        setCustomerRecord(null);
        setTotalInvested(0);
        setPendingDues(0);
        setChits([]);
      }
    } catch (e) {
      console.warn('Error fetching customer profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomerProfile();
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[400]} />}
    >
      <StatusBar barStyle="light-content" />

      {/* Account Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(customerRecord?.name || user?.name || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{customerRecord?.name || user?.name || 'Customer'}</Text>
            <Text style={styles.clientMeta}>
              ID: {customerRecord?.id || user?.id} • {customerRecord?.phone || user?.phone || 'Mobile App Member'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutPill} onPress={logout}>
            <Ionicons name="log-out-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.balanceGrid}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>TOTAL INVESTED</Text>
            <Text style={styles.investedVal}>{formatCurrency(totalInvested)}</Text>
          </View>
          <View style={styles.vDivider} />
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>PENDING DUES</Text>
            <Text style={[styles.dueVal, pendingDues > 0 ? { color: '#f87171' } : { color: '#4ade80' }]}>
              {formatCurrency(pendingDues)}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Pay CTA Bar */}
      {pendingDues > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="information-circle" size={20} color="#c2410c" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Installment Payment Due</Text>
            <Text style={styles.alertText}>
              You have {formatCurrency(pendingDues)} pending for this month. Pay online via UPI or Bank Transfer.
            </Text>
          </View>
        </View>
      )}

      {/* My Chits Subscriptions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Chit Enrollments ({chits.length})</Text>
        <Text style={styles.sectionBadge}>LIVE SCHEMES</Text>
      </View>

      <View style={styles.chitsList}>
        {chits.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Ionicons name="folder-open-outline" size={40} color={Colors.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: Colors.textSecondary }}>
              No Active Chit Enrollments
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: Colors.textMuted, textAlign: 'center' }}>
              You are not currently enrolled in any chit groups. Contact admin to join a savings scheme.
            </Text>
          </View>
        ) : (
          chits.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chitCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('CustomerSchedule', {
                  customer: customerRecord,
                  chit: item,
                })
              }
            >
              <View style={styles.chitHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle}>{item.groupName}</Text>
                  <Text style={styles.ticketSubtitle}>
                    Ticket #{item.ticketNumber} • {item.scheme || 'Auction'} Plan
                  </Text>
                </View>
                {item.isWithdrawn ? (
                  <View style={styles.prizeClaimedBadge}>
                    <Text style={styles.prizeClaimedText}>PRIZE CLAIMED</Text>
                  </View>
                ) : (
                  <View style={styles.activePlanBadge}>
                    <Text style={styles.activePlanText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.subLabel}>CHIT VALUE</Text>
                  <Text style={styles.mainVal}>{formatCurrency(item.chitValue)}</Text>
                </View>
                <View>
                  <Text style={styles.subLabel}>MONTHLY DUE</Text>
                  <Text style={styles.mainVal}>{formatCurrency(item.monthlyInstallment || 5000)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subLabel}>STATUS</Text>
                  <Text
                    style={[
                      styles.mainVal,
                      item.paymentStatus === 'PAID' ? { color: Colors.success } : { color: Colors.danger },
                    ]}
                  >
                    {item.paymentStatus || 'DUE'}
                  </Text>
                </View>
              </View>

              <View style={styles.tapPrompt}>
                <Text style={styles.tapPromptText}>Tap to View 20-Month Schedule & Prize Chart</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary[700]} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Official Company Bank & UPI Transfer Card */}
      <View style={styles.bankCard}>
        <View style={styles.bankTopRow}>
          <View style={styles.bankIconCircle}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary[800]} />
          </View>
          <View>
            <Text style={styles.bankCardTitle}>Official Collection Account</Text>
            <Text style={styles.bankCardSub}>Verified Company Direct Deposit</Text>
          </View>
        </View>

        <View style={styles.bankGrid}>
          <View style={styles.bankDetailItem}>
            <Text style={styles.bLabel}>COMPANY A/C</Text>
            <Text style={styles.bVal}>{companyBank?.accountHolderName || companyBank?.accountHolder || 'Jenista Chits Pvt Ltd'}</Text>
          </View>
          <View style={styles.bankDetailItem}>
            <Text style={styles.bLabel}>A/C NUMBER</Text>
            <Text style={styles.bVal}>{companyBank?.accountNumber || '—'}</Text>
          </View>
          <View style={styles.bankDetailItem}>
            <Text style={styles.bLabel}>BANK & IFSC</Text>
            <Text style={styles.bVal}>
              {companyBank ? `${companyBank.bankName} • ${companyBank.ifscCode || companyBank.ifsc || '—'}` : '—'}
            </Text>
          </View>
          <View style={styles.bankDetailItem}>
            <Text style={styles.bLabel}>OFFICIAL UPI ID</Text>
            <Text style={styles.bValGold}>{companyBank?.upiId || 'jenistachits@hdfcbank'}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroCard: {
    backgroundColor: Colors.navy.primary,
    margin: 16,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: Colors.navy.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0B1A30',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  clientMeta: {
    fontSize: 12,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  logoutPill: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  balanceGrid: {
    flexDirection: 'row',
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  vDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral[400],
    letterSpacing: 0.5,
  },
  investedVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4ade80',
    marginTop: 4,
  },
  dueVal: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#ffedd5',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9a3412',
  },
  alertText: {
    fontSize: 11,
    color: '#c2410c',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary[700],
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  chitsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  chitCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  chitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  ticketSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  prizeClaimedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prizeClaimedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  activePlanBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePlanText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  mainVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  tapPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  tapPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  bankCard: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  bankCardSub: {
    fontSize: 11,
    color: '#64748b',
  },
  bankGrid: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  bankDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  bVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  bValGold: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary[700],
  },
});
