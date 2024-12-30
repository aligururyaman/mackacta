'use client';
import { auth, db } from '@/utils/firebase';
import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import pitch from '@/app/assets/main/pitch.png';

function LineUp() {
  const [userData, setUserData] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLineup, setExpandedLineup] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
        setLineups([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userData?.teamId) {
      fetchLineups();
    }
  }, [userData]);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);

        // Takım kaptanı kontrolü
        if (userData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
          if (teamDoc.exists()) {
            setIsCaptain(teamDoc.data().captainId === userId); // Kullanıcının kaptan olup olmadığını kontrol et
          }
        }
      }
    } catch (error) {
      console.error('Kullanıcı verisi alınırken hata oluştu:', error);
    }
  };

  const fetchLineups = async () => {
    try {
      const lineupsSnapshot = await getDocs(collection(db, `teams/${userData.teamId}/lineups`));
      const lineups = lineupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLineups(lineups);
    } catch (error) {
      console.error('Kadro bilgileri alınırken hata oluştu:', error);
    }
  };

  const deleteLineup = async (lineupId) => {
    try {
      if (!isCaptain) {
        alert('Sadece takım kaptanı kadroları silebilir.');
        return;
      }

      const lineupRef = doc(db, `teams/${userData.teamId}/lineups`, lineupId);
      await deleteDoc(lineupRef);
      alert('Kadro başarıyla silindi!');
      setLineups((prev) => prev.filter((lineup) => lineup.id !== lineupId));
    } catch (error) {
      console.error('Kadro silinirken hata oluştu:', error);
      alert('Kadro silinemedi.');
    }
  };

  const toggleLineup = (lineupId) => {
    setExpandedLineup((prev) => (prev === lineupId ? null : lineupId));
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      {loading ? (
        <p className="text-center text-slate-700 text-xl font-semibold">Yükleniyor...</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-700 mb-6">Takım Kadroları</h1>
          {lineups.length > 0 ? (
            <div className="flex flex-col gap-6">
              {lineups.map((lineup) => (
                <div key={lineup.id} className="border rounded-lg shadow-lg bg-foreground w-full md:w-[600px]">
                  <div
                    className="p-4 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-t-lg justify-between flex items-center"
                    onClick={() => toggleLineup(lineup.id)}
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-slate-700">{lineup.id}</h2>
                      <p className="text-sm text-slate-600">Formasyon: {lineup.formation}</p>
                    </div>

                    <div>
                      {isCaptain && (
                        <button
                          className=" bottom-4 right-4 bg-button text-slate-700 px-4 py-2 rounded-lg hover:bg-background shadow-lg "
                          onClick={() => deleteLineup(lineup.id)}
                        >
                          Sil
                        </button>
                      )}
                    </div>

                  </div>
                  {expandedLineup === lineup.id && (
                    <div className="relative w-full md:w-[600px] h-[400px] border-t bg-background rounded-b-lg">
                      <Image
                        src={pitch}
                        layout="fill"
                        alt="Lineup"

                        objectFit="cover"
                      />
                      {lineup.positions.map((pos, index) => (
                        <div
                          key={index}
                          className="absolute w-20 h-20 rounded-full text-white flex flex-col items-center justify-center cursor-default "
                          style={{
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <Image
                            src={pos.player.profileImage}
                            alt={pos.player.name}
                            width={80}
                            height={80}
                            className="w-full h-full rounded-full object-cover"
                          />
                          <span className="mt-1 text-xs font-bold text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                            {pos.player.name}
                          </span>
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-700 text-center text-lg">Kayıtlı bir kadro bulunamadı.</p>
          )}
        </>
      )}
    </div>
  );
}

export default LineUp;
