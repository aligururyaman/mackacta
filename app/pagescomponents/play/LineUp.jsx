'use client';
import { auth, db } from '@/utils/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import pitch from '@/app/assets/main/pitch.png';

function LineUp() {
  const [userData, setUserData] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLineup, setExpandedLineup] = useState(null);

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
        setUserData(userDoc.data());
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

  const toggleLineup = (lineupId) => {
    setExpandedLineup((prev) => (prev === lineupId ? null : lineupId));
  };

  return (
    <div className="p-4">
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          <h1 className="text-xl font-bold mb-4">Takım Kadroları</h1>
          {lineups.length > 0 ? (
            lineups.map((lineup) => (
              <div key={lineup.id} className="mb-4 border rounded-lg shadow-lg">
                <div
                  className="p-4 cursor-pointer bg-gray-100 hover:bg-gray-200"
                  onClick={() => toggleLineup(lineup.id)}
                >
                  <h2 className="text-lg font-semibold">{lineup.id}</h2>
                  <p className="text-sm text-gray-600">Formasyon: {lineup.formation}</p>
                </div>
                {expandedLineup === lineup.id && (
                  <div className="relative w-full md:w-[600px] h-[400px] border-t bg-white">
                    <Image
                      src={pitch}
                      layout="fill"
                      alt="Lineup"
                      className="rounded-lg"
                      objectFit="cover"
                    />
                    {lineup.positions.map((pos, index) => (
                      <div
                        key={index}
                        className="absolute w-16 h-16 rounded-full bg-button text-white flex flex-col items-center justify-center cursor-default"
                        style={{
                          left: pos.x,
                          top: pos.y,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <img
                          src={pos.player.profileImage}
                          alt={pos.player.name}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                        />
                        <span className="mt-1 text-xs font-bold text-white bg-black bg-opacity-50 px-1 rounded">
                          {pos.player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Kayıtlı bir kadro bulunamadı.</p>
          )}
        </>
      )}
    </div>
  );
}

export default LineUp;
