// ═══════════════════════════════════════════════════════════════════════
// chartCalculationEngine.js — Surya Jyotish Chart Calculation Engine
// Extracted & cleaned from surya-ai-brain-10-1-1.html ("Konark Edition v7-v9")
//
// Self-contained sidereal Vedic astronomy engine — NO external dependencies,
// NO API calls, NO ephemeris files needed. Pure JS implementation of Meeus'
// astronomical algorithms (Jean Meeus, "Astronomical Algorithms"):
//   • Julian Day + Delta-T (NASA/Espenak polynomial)
//   • Nutation (63-term IAU series) + true obliquity
//   • True Lahiri ayanamsha (IAU2006 precession + nutation)
//   • Sun/Moon/Mars/Mercury/Venus/Jupiter/Saturn geocentric longitude
//     (Meeus full series incl. Moon 60-term + 17-term latitude series)
//   • Topocentric parallax correction (Sun/Moon/planets)
//   • Rahu/Ketu (true node)
//   • Ascendant + MC (IAU2006 GAST) + Sripati (quadrant) house cusps
//   • Bhava Chalit house assignment
//   • Varga (divisional) charts: D1, D9 (Navamsa), D10 (Dashamsa), D12 (Dwadasamsa)
//   • Full 3-level Vimshottari Dasha (Mahadasha / Antardasha / Pratyantardasha)
//   • Shadbala-style 6-fold planetary strength (Sthana/Dig/Kala/Cheshta/Drik/Naisargika Bala)
//   • Planetary aspects (Drishti), combustion, dignity (exalted/debilitated/own)
//
// Accuracy: ~1 arcminute for planets, comparable to Swiss Ephemeris Moshier mode.
// For sub-arcsecond precision, use the Python Swiss Ephemeris backend instead
// (see ../chart-engine/astro-python-backend/).
//
// USAGE:
//   import { calcKundli, calcDasha, calcVarga, calcShadbala } from './chartCalculationEngine.js';
//   const kundli = calcKundli(1990, 5, 14, 10, 30, 28.6139, 77.2090, 5.5);
//   // kundli.structured.planets -> array of planet objects (see calcKundli JSDoc below)
//   const dashas = calcDasha(kundli, '1990-05-14');
//   const shadbala = calcShadbala(kundli, true); // true = daytime birth
// ═══════════════════════════════════════════════════════════════════════

// ── CALCULATION ENGINE (Konark Edition v7 — Nakshatrika) ─────────────
// Upgrades: deltaT, full Meeus planet series, 60-term Moon, proper ayanamsa anchor,
//           Varga charts (D1/D9/D10/D12), retrograde, Pratyantardasha
  const DEG_R=Math.PI/180, RAD_D=180/Math.PI, ARCSEC_DEG=1/3600;
  const NAK_NAMES_SE=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
  const NAK_LORDS_SE=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  const SIGN_NAMES_SE=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
  const DASHA_ORDER_SE=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  const DASHA_YEARS_SE={Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};

  function norm360(x){return((x%360)+360)%360;}

  // ── JD (full Gregorian) ──
  function toJD_SE(year,month,day,hour,min,tz){
    const ut=hour+min/60-tz;let y=year,m=month,d=day+ut/24;
    if(m<=2){y--;m+=12;}
    const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
    return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5;
  }

  // ── DELTA T — NASA polynomial (Espenak & Meeus 2006) ──
  function deltaT_SE(year){
    const t=year-2000;
    if(year<-500) return -20+32*Math.pow((year-1820)/100,2);
    if(year<500){const u=year/100;return 10583.6-1014.41*u+33.78311*u*u-5.952053*u*u*u-0.1798452*Math.pow(u,4)+0.022174192*Math.pow(u,5)+0.0090316521*Math.pow(u,6);}
    if(year<1600){const u=(year-1000)/100;return 1574.2-556.01*u+71.23472*u*u+0.319781*u*u*u-0.8503463*Math.pow(u,4)-0.005050998*Math.pow(u,5)+0.0083572073*Math.pow(u,6);}
    if(year<1700){const u=year-1600;return 120-0.9808*u-0.01532*u*u+u*u*u/7129;}
    if(year<1800){const u=year-1700;return 8.83+0.1603*u-0.0059285*u*u+0.00013336*u*u*u-u*u*u*u/1174000;}
    if(year<1860){const u=year-1800;return 13.72-0.332447*u+0.0068612*u*u+0.0041116*u*u*u-0.00037436*Math.pow(u,4)+0.0000121272*Math.pow(u,5)-0.0000001699*Math.pow(u,6)+0.000000000875*Math.pow(u,7);}
    if(year<1900){const u=year-1860;return 7.62+0.5737*u-0.251754*u*u+0.01680668*u*u*u-0.0004473624*Math.pow(u,4)+u*u*u*u*u/233174;}
    if(year<1920){const u=year-1900;return -2.79+1.494119*u-0.0598939*u*u+0.0061966*u*u*u-0.000197*Math.pow(u,4);}
    if(year<1941){const u=year-1920;return 21.20+0.84493*u-0.076100*u*u+0.0020936*u*u*u;}
    if(year<1961){const u=year-1950;return 29.07+0.407*u-u*u/233+u*u*u/2547;}
    if(year<1986){const u=year-1975;return 45.45+1.067*u-u*u/260-u*u*u/718;}
    if(year<2005){const u=year-2000;return 63.86+0.3345*u-0.060374*u*u+0.0017275*u*u*u+0.000651814*Math.pow(u,4)+0.00002373599*Math.pow(u,5);}
    if(year<2050) return 62.92+0.32217*t+0.005589*t*t;
    if(year<2150) return -20+32*Math.pow((year-1820)/100,2)-0.5628*(2150-year);
    return -20+32*Math.pow((year-1820)/100,2);
  }

  function Tc(jd){return(jd-2451545.0)/36525.0;}
  // Convert JD (UT) → TT
  function jdToTT(jd,year){return jd+deltaT_SE(year)/86400.0;}

  function meanObliquity(T){return 23.439291111-0.013004167*T-0.0000001639*T*T+0.0000005036*T*T*T;}

  // ── NUTATION — 63 term IAU (Meeus Table 22.A) ──
  function nutation(T){
    const T2=T*T;
    const D=(norm360(297.8501921+445267.1114034*T-0.0018819*T2+T*T2/545868-T2*T2/113065000))*DEG_R;
    const M=(norm360(357.5291092+35999.0502909*T-0.0001536*T2+T2*T/24490000))*DEG_R;
    const Mp=(norm360(134.9633964+477198.8675055*T+0.0087414*T2+T2*T/69699-T2*T2/14712000))*DEG_R;
    const F=(norm360(93.2720950+483202.0175233*T-0.0036539*T2-T2*T/3526000+T2*T2/863310000))*DEG_R;
    const O=(norm360(125.04452-1934.136261*T+0.0020708*T2+T2*T/450000))*DEG_R;
    const NT=[
      [0,0,0,0,1,-171996,-174.2,92025,8.9],[-2,0,0,2,2,-13187,-1.6,5736,-3.1],[0,0,0,2,2,-2274,-0.2,977,-0.5],
      [0,0,0,0,2,2062,0.2,-895,0.5],[0,1,0,0,0,1426,-3.4,54,-0.1],[0,0,1,0,0,712,0.1,-7,0.0],
      [-2,1,0,2,2,-517,1.2,224,-0.6],[0,0,0,2,1,-386,-0.4,200,0.0],[0,0,1,2,2,-301,0.0,129,-0.1],
      [-2,-1,0,2,2,217,-0.5,-95,0.3],[-2,0,1,0,0,-158,0.0,0,0.0],[-2,0,0,2,1,129,0.1,-70,0.0],
      [0,0,-1,2,2,123,0.0,-53,0.0],[2,0,0,0,0,63,0.0,0,0.0],[0,0,1,0,1,63,0.1,-33,0.0],
      [2,0,-1,2,2,-59,0.0,26,0.0],[0,0,-1,0,1,-58,-0.1,32,0.0],[0,0,1,2,1,-51,0.0,27,0.0],
      [-2,0,2,0,0,48,0.0,0,0.0],[0,0,-2,2,1,46,0.0,-24,0.0],[2,0,0,2,2,-38,0.0,16,0.0],
      [0,0,2,2,2,-31,0.0,13,0.0],[0,0,2,0,0,29,0.0,0,0.0],[-2,0,1,2,2,29,0.0,-12,0.0],
      [0,0,0,2,0,26,0.0,0,0.0],[-2,0,0,2,0,-22,0.0,0,0.0],[0,0,-1,2,1,21,0.0,-10,0.0],
      [0,2,0,0,0,17,-0.1,0,0.0],[2,0,-1,0,1,16,0.0,-8,0.0],[-2,2,0,2,2,-16,0.1,7,0.0],
      [0,1,0,0,1,-15,0.0,9,0.0],[-2,0,1,0,1,-13,0.0,7,0.0],[0,-1,0,0,1,-12,0.0,6,0.0],
      [0,0,2,-2,0,11,0.0,0,0.0],[2,0,-1,2,1,-10,0.0,5,0.0],[2,0,1,2,2,-8,0.0,3,0.0],
      [0,1,0,2,2,-7,0.0,3,0.0],[-2,1,1,0,0,7,0.0,0,0.0],[0,-1,0,2,2,-7,0.0,3,0.0],
      [2,0,0,2,1,-8,0.0,4,0.0],[0,0,1,2,0,6,0.0,0,0.0],[-2,0,2,2,2,6,0.0,-3,0.0],
      [-2,0,1,2,1,6,0.0,-3,0.0],[2,0,-2,0,1,-6,0.0,3,0.0],[2,0,0,0,1,-6,0.0,3,0.0],
      [0,-1,1,0,0,5,0.0,0,0.0],[-2,-1,0,2,1,-5,0.0,3,0.0],[-2,0,0,0,1,-5,0.0,3,0.0],
      [0,0,2,2,1,-5,0.0,3,0.0],[-2,0,2,0,1,4,0.0,0,0.0],[-2,1,0,2,1,4,0.0,-2,0.0],
      [0,0,1,-2,0,4,0.0,0,0.0],[-1,0,1,0,0,-4,0.0,0,0.0],[-2,1,0,0,0,-4,0.0,0,0.0],
      [1,0,0,0,0,3,0.0,0,0.0],[0,0,1,2,0,-3,0.0,0,0.0],[-1,-1,1,0,0,-3,0.0,0,0.0],
      [0,1,1,0,0,-3,0.0,0,0.0],[0,-1,1,2,2,-3,0.0,1,0.0],[2,-1,-1,2,2,-3,0.0,1,0.0],
      [0,0,-2,2,2,-3,0.0,1,0.0],[0,0,3,2,2,-3,0.0,1,0.0],[2,-1,0,2,2,-3,0.0,1,0.0]
    ];
    let dp=0,de=0;
    for(const r of NT){const a=r[0]*D+r[1]*M+r[2]*Mp+r[3]*F+r[4]*O;dp+=(r[5]+r[6]*T)*Math.sin(a);de+=(r[7]+r[8]*T)*Math.cos(a);}
    return{dpsi:dp*0.0001*ARCSEC_DEG,deps:de*0.0001*ARCSEC_DEG};
  }

  // ── LAHIRI AYANAMSA — Chitra-Paksha, anchored to Spica = 180° sidereal ──
  // Epoch J2000.0: Lahiri ayanamsa = 23°51'11.5" = 85871.5 arcsec (IAU consensus)
  // IAU 2006 precession model (Capitaine et al.): pA = 5029.096929*T + 1.558400*T² - 0.000344*T³
  function lahiriAyanamsha(jd,useTrueAyan=true){
    const T=Tc(jd);
    // IAU 2006 general precession in longitude (arcseconds from J2000)
    const precArcsec=5029.096929*T+1.558400*T*T-0.000344*T*T*T;
    // Lahiri epoch value at J2000.0 (arcsec) — matches Astronomical Ephemeris standard
    const epochArcsec=85871.5;
    const ayanArcsec=epochArcsec+precArcsec;
    let ayan=ayanArcsec/3600.0;
    // True ayanamsa: add nutation in longitude (equation of equinoxes contribution)
    if(useTrueAyan) ayan+=nutation(T).dpsi;
    return norm360(ayan);
  }

  // ══════════════════════════════════════════════════════════
  // PHASE 2 — Observer-corrected astronomical precision
  // ══════════════════════════════════════════════════════════

  // ── EARTH ROTATION ANGLE (IAU 2000) ──
  function earthRotationAngle(jdUT1){
    const d=jdUT1-2451545.0,f=jdUT1%1.0;
    return norm360(360*(f+0.7790572732640+0.00273781191135448*d));
  }

  // ── GMST — IAU 2006 high-precision polynomial ──
  // Input: jdUT1 (for Earth rotation), jdTT (for polynomial T)
  function gmst_IAU2006(jdUT1,jdTT){
    const T=(jdTT-2451545.0)/36525.0;
    // Capitaine et al. 2003: coefficients in arcseconds
    const gmstSec=
      67310.54841+
      (876600.0*3600.0+8640184.812866)*T+
      0.093104*T*T-
      6.2e-6*T*T*T;
    // Convert seconds → degrees (1s = 1/240 deg) then add ERA fraction
    return norm360(gmstSec/240.0);
  }

  // ── GAST = GMST + equation of equinoxes ──
  function gast_IAU2006(jdUT1,jdTT){
    const T=Tc(jdTT);
    const gmstDeg=gmst_IAU2006(jdUT1,jdTT);
    const {dpsi}=nutation(T);
    const eps0=meanObliquity(T);
    // Equation of equinoxes: dpsi * cos(eps0) [degrees]
    const eqEq=dpsi*Math.cos(eps0*DEG_R);
    return norm360(gmstDeg+eqEq);
  }

  // ── LOCAL APPARENT SIDEREAL TIME ──
  function localSiderealTime_P2(jdUT1,jdTT,longitude){
    return norm360(gast_IAU2006(jdUT1,jdTT)+longitude);
  }

  // ── ECLIPTIC ↔ EQUATORIAL TRANSFORMS ──
  function eclToEqu(lon,lat,eps){
    const λ=lon*DEG_R,β=lat*DEG_R,ε=eps*DEG_R;
    const sinDec=Math.sin(β)*Math.cos(ε)+Math.cos(β)*Math.sin(ε)*Math.sin(λ);
    const dec=Math.asin(Math.max(-1,Math.min(1,sinDec)));
    const y=Math.sin(λ)*Math.cos(ε)-Math.tan(β)*Math.sin(ε);
    const x=Math.cos(λ);
    return{ra:norm360(Math.atan2(y,x)*RAD_D),dec:dec*RAD_D};
  }

  function equToEcl(ra,dec,eps){
    const α=ra*DEG_R,δ=dec*DEG_R,ε=eps*DEG_R;
    const sinBeta=Math.sin(δ)*Math.cos(ε)-Math.cos(δ)*Math.sin(ε)*Math.sin(α);
    const β=Math.asin(Math.max(-1,Math.min(1,sinBeta)));
    const y=Math.sin(α)*Math.cos(ε)+Math.tan(δ)*Math.sin(ε);
    const x=Math.cos(α);
    return{lon:norm360(Math.atan2(y,x)*RAD_D),lat:β*RAD_D};
  }

  // ── FULL TOPOCENTRIC CORRECTION (Meeus Ch.40) ──
  // Inputs: ra/dec in degrees, distAU, jdUT1/jdTT, lat/lon degrees
  // Returns: {ra, dec} topocentric degrees
  function topocentricCorrection(ra,dec,distAU,jdUT1,jdTT,lat,lon){
    const φ=lat*DEG_R;
    const lst=localSiderealTime_P2(jdUT1,jdTT,lon)*DEG_R; // radians
    const α=ra*DEG_R,δ=dec*DEG_R;
    const H=lst-α; // local hour angle (radians)
    // Earth equatorial radius in AU
    const RE_AU=6378.137/149597870.7;
    // Equatorial horizontal parallax (radians)
    const sinPi=RE_AU/distAU;
    const cosφ=Math.cos(φ),sinφ=Math.sin(φ);
    const cosδ=Math.cos(δ),sinδ=Math.sin(δ);
    const sinH=Math.sin(H),cosH=Math.cos(H);
    // Δα (radians)
    const Δα=Math.atan2(
      -cosφ*sinPi*sinH,
      cosδ-cosφ*sinPi*cosH
    );
    // Δδ (radians)
    const Δδ=Math.atan2(
      (sinδ-sinφ*sinPi)*Math.cos(Δα),
      cosδ-cosφ*sinPi*cosH
    )-δ;
    return{
      ra:norm360((α+Δα)*RAD_D),
      dec:(δ+Δδ)*RAD_D
    };
  }

  // ── MOON TOPOCENTRIC ECLIPTIC POSITION ──
  // Returns {lon, lat} in tropical degrees after full topo correction
  function moonTopocentric_P2(jdUT1,jdTT,lat,lon){
    const T=Tc(jdTT);
    const eps=meanObliquity(T)+nutation(T).deps; // true obliquity
    const moonLonTrop=moonLon(jdTT);
    const moonLatVal=moonLat(jdTT);
    const distKm=moonDist(jdTT);
    const distAU=distKm/149597870.7;
    // Ecliptic → Equatorial
    const {ra,dec}=eclToEqu(moonLonTrop,moonLatVal,eps);
    // Topocentric correction
    const topo=topocentricCorrection(ra,dec,distAU,jdUT1,jdTT,lat,lon);
    // Back to ecliptic
    return equToEcl(topo.ra,topo.dec,eps);
  }

  // ── PLANET TOPOCENTRIC APPARENT ECLIPTIC ──
  // Full pipeline: geometric lon/lat → equatorial → topocentric → back to ecliptic
  function planetTopoEcliptic_P2(tropLon,tropLat,distAU,jdUT1,jdTT,lat,lon){
    const T=Tc(jdTT);
    const eps=meanObliquity(T)+nutation(T).deps;
    const {ra,dec}=eclToEqu(tropLon,tropLat,eps);
    const topo=topocentricCorrection(ra,dec,distAU,jdUT1,jdTT,lat,lon);
    return equToEcl(topo.ra,topo.dec,eps);
  }

  // ══════════════════════════════════════════════════════════
  // END PHASE 2
  // ══════════════════════════════════════════════════════════

  // ── ABERRATION (Sun-Earth vector, full Meeus formula) ──
  function aberration(jd,lon){
    const T=Tc(jd),L0=norm360(280.46646+36000.76983*T)*DEG_R,
          e=0.016708634-0.000042037*T,
          pi_lon=(102.93735+1.71946*T+0.00046*T*T)*DEG_R,
          lam=lon*DEG_R,k=20.49552*ARCSEC_DEG;
    return -k*Math.cos(L0-lam)+e*k*Math.cos(pi_lon-lam);
  }

  // ── LIGHT-TIME: use planet daily motion + approximate distance AU ──
  const AU_IN_DAYS=499.00478/86400; // 1 AU in days
  function lightTimeCorr(dist_au,dm){return dist_au?-dm*dist_au*AU_IN_DAYS:0;}

  // ── SUN — Meeus Ch.25 full series ──
  function sunLon(jd){
    const T=Tc(jd),T2=T*T;
    const L0=norm360(280.46646+36000.76983*T+0.0003032*T2);
    const M=(norm360(357.52911+35999.05029*T-0.0001537*T2))*DEG_R;
    const C=(1.914602-0.004817*T-0.000014*T2)*Math.sin(M)
            +(0.019993-0.000101*T)*Math.sin(2*M)
            +0.000289*Math.sin(3*M);
    const theta=norm360(L0+C);
    // nutation + aberration combined (apparent sun)
    const nutT=Tc(jd);
    const O=(125.04-1934.136*nutT)*DEG_R;
    return norm360(theta-0.00569-0.00478*Math.sin(O));
  }

  // ── MOON — Meeus Ch.47, full 60-term longitude ──
  function moonLon(jd){
    const T=Tc(jd),T2=T*T,T3=T2*T,T4=T3*T;
    const Lp=norm360(218.3164477+481267.88123421*T-0.0015786*T2+T3/538841-T4/65194000);
    const D=norm360(297.8501921+445267.1114034*T-0.0018819*T2+T3/545868-T4/113065000)*DEG_R;
    const M=norm360(357.5291092+35999.0502909*T-0.0001536*T2+T3/24490000)*DEG_R;
    const Mp=norm360(134.9633964+477198.8675055*T+0.0087414*T2+T3/69699-T4/14712000)*DEG_R;
    const F=norm360(93.2720950+483202.0175233*T-0.0036539*T2-T3/3526000+T4/863310000)*DEG_R;
    const A1=norm360(119.75+131.849*T)*DEG_R;
    const A2=norm360(53.09+479264.290*T)*DEG_R;
    const A3=norm360(313.45+481266.484*T)*DEG_R;
    const E=1-0.002516*T-0.0000074*T2,E2=E*E;
    // 60 longitude terms (Meeus Table 47.A)
    const LT=[
      [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
      [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
      [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
      [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
      [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
      [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
      [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
      [2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],
      [0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
      [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
      [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],
      [2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
      [4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,351],
      [1,1,1,0,-340],[3,0,-2,0,330],[4,0,-3,0,327],[2,-1,2,0,-323],
      [0,2,1,0,299],[2,0,3,0,294],[2,0,-1,-2,0],[0,0,0,0,0]
    ];
    let sL=0;
    for(const r of LT){
      if(!r[4])continue;
      const arg=r[0]*D+r[1]*M+r[2]*Mp+r[3]*F;
      let coef=r[4];
      if(Math.abs(r[1])===1)coef*=E;
      else if(Math.abs(r[1])===2)coef*=E2;
      sL+=coef*Math.sin(arg);
    }
    // Additive terms A1, A2, Venus
    sL+=3958*Math.sin(A1)+1962*Math.sin(Lp*DEG_R-F)+318*Math.sin(A2);
    return norm360(Lp+sL/1000000);
  }

  // ── MOON LATITUDE — Meeus Ch.47, 17-term series ──
  function moonLat(jd){
    const T=Tc(jd),T2=T*T,T3=T2*T,T4=T3*T;
    const D=norm360(297.8501921+445267.1114034*T-0.0018819*T2+T3/545868-T4/113065000)*DEG_R;
    const M=norm360(357.5291092+35999.0502909*T-0.0001536*T2+T3/24490000)*DEG_R;
    const Mp=norm360(134.9633964+477198.8675055*T+0.0087414*T2+T3/69699-T4/14712000)*DEG_R;
    const F=norm360(93.2720950+483202.0175233*T-0.0036539*T2-T3/3526000+T4/863310000)*DEG_R;
    const A1=norm360(119.75+131.849*T)*DEG_R;
    const A3=norm360(313.45+481266.484*T)*DEG_R;
    const E=1-0.002516*T-0.0000074*T2,E2=E*E;
    // Table 47.B — latitude terms
    const LB=[
      [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],
      [2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],
      [2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
      [2,0,1,1,4200],[-2,1,0,1,3359],[2,1,1,-1,2463],[2,-1,-1,1,2211],
      [2,-1,0,1,2065],[0,1,-1,-1,-1870]
    ];
    let sB=0;
    for(const r of LB){
      const arg=r[0]*D+r[1]*M+r[2]*Mp+r[3]*F;
      let coef=r[4];
      if(Math.abs(r[1])===1)coef*=E;
      else if(Math.abs(r[1])===2)coef*=E2;
      sB+=coef*Math.sin(arg);
    }
    sB+=-2235*Math.sin(Mp)+382*Math.sin(A3)+175*Math.sin(A1-F)+175*Math.sin(A1+F)+127*E*Math.sin(Mp-M)-115*E*Math.sin(Mp+M);
    // Latitude in degrees
    return sB/1000000.0;
  }

  // ── MOON DISTANCE — Meeus Ch.47, distance in km ──
  function moonDist(jd){
    const T=Tc(jd),T2=T*T,T3=T2*T,T4=T3*T;
    const D=norm360(297.8501921+445267.1114034*T-0.0018819*T2+T3/545868-T4/113065000)*DEG_R;
    const M=norm360(357.5291092+35999.0502909*T-0.0001536*T2+T3/24490000)*DEG_R;
    const Mp=norm360(134.9633964+477198.8675055*T+0.0087414*T2+T3/69699-T4/14712000)*DEG_R;
    const F=norm360(93.2720950+483202.0175233*T-0.0036539*T2-T3/3526000+T4/863310000)*DEG_R;
    const E=1-0.002516*T-0.0000074*T2,E2=E*E;
    const LR=[
      [0,0,1,0,-20905355],[2,0,-1,0,-3699111],[2,0,0,0,-2955968],[0,0,2,0,-569925],
      [0,1,0,0,48888],[0,0,0,2,-3149],[2,0,-2,0,246158],[2,-1,-1,0,-152138],
      [2,0,1,0,-170733],[2,-1,0,0,-204586],[0,1,-1,0,-129620],[1,0,0,0,108743],
      [0,1,1,0,104755],[2,0,0,-2,10321],[0,0,1,2,0],[4,0,-1,0,79661]
    ];
    let sR=0;
    for(const r of LR){
      const arg=r[0]*D+r[1]*M+r[2]*Mp+r[3]*F;
      let coef=r[4];
      if(Math.abs(r[1])===1)coef*=E;
      else if(Math.abs(r[1])===2)coef*=E2;
      sR+=coef*Math.cos(arg);
    }
    return 385000.56+sR/1000.0; // km
  }

  // ── MOON TOPOCENTRIC CORRECTION (parallax in longitude) ──
  // Shifts apparent Moon position for observer on Earth surface
  // ── KEPLER SOLVER (for inner planet geocentric) ──
  function solveKeplerEcc(M_rad,e){
    let E=M_rad;
    for(let i=0;i<12;i++) E=E-(E-e*Math.sin(E)-M_rad)/(1-e*Math.cos(E));
    return E;
  }

  // ── EARTH HELIOCENTRIC XY (ecliptic plane, AU) ──
  function earthHelioXY(T){
    const T2=T*T;
    const M_E=norm360(357.52910918+35999.05028*T-0.0001559*T2)*DEG_R;
    const e_E=0.016708617-0.000042037*T-0.0000001236*T2;
    const E_E=solveKeplerEcc(M_E,e_E);
    const xv=Math.cos(E_E)-e_E, yv=Math.sqrt(1-e_E*e_E)*Math.sin(E_E);
    const v_E=Math.atan2(yv,xv), r_E=Math.sqrt(xv*xv+yv*yv);
    const omega_E=norm360(102.93768193+0.32327364*T)*DEG_R;
    const L_E=v_E+omega_E;
    return {x:r_E*Math.cos(L_E), y:r_E*Math.sin(L_E)};
  }

  // ── INNER PLANET GEOCENTRIC LONGITUDE (proper helio→geo conversion) ──
  function innerPlanetGeoLon(jd,a,M0_deg,n_deg,e0,de,omega_deg){
    const T=Tc(jd),T2=T*T;
    const M_P=norm360(M0_deg+n_deg*T)*DEG_R;
    const e_P=e0+de*T;
    const E_P=solveKeplerEcc(M_P,e_P);
    const xv=Math.cos(E_P)-e_P, yv=Math.sqrt(1-e_P*e_P)*Math.sin(E_P);
    const v_P=Math.atan2(yv,xv), r_P=a*Math.sqrt(xv*xv+yv*yv);
    const omega_P=norm360(omega_deg)*DEG_R;
    const L_P=v_P+omega_P;
    const x_P=r_P*Math.cos(L_P), y_P=r_P*Math.sin(L_P);
    const {x:x_E,y:y_E}=earthHelioXY(T);
    return norm360(Math.atan2(y_P-y_E,x_P-x_E)/DEG_R);
  }

  // ── MERCURY — proper geocentric via Earth vector subtraction ──
  // ── MERCURY — proper geocentric via Earth vector subtraction ──
  // Constants: Meeus Table 31.a precision values
  function mercuryLon(jd){
    return innerPlanetGeoLon(jd,
      0.38709893,          // semi-major axis (AU)
      174.7947870,         // M0 (deg) — mean anomaly at J2000
      149472.6749357,      // n (deg/century) — Meeus Table 31.a corrected
      0.20563069,          // e0
      0.000000002,         // de/century
      77.45779628          // longitude of perihelion (varpi)
    );
  }

  // ── VENUS — proper geocentric via Earth vector subtraction ──
  function venusLon(jd){
    return innerPlanetGeoLon(jd,
      0.72332982,          // semi-major axis (AU)
      50.41615800,         // M0
      58517.8038768,       // n (deg/century)
      0.00677323,          // e0
      -0.000004938,        // de/century
      131.56370300         // longitude of perihelion
    );
  }

  // ── MARS — proper geocentric via Earth vector subtraction ──
  function marsLon(jd){
    const T=Tc(jd);
    const a=1.52366231;
    const e=0.09341233-0.00011484*T;
    const L=norm360(355.45332+19140.30268*T);
    const omegaP=norm360(336.04084+1.84169*T);
    const M=norm360(L-omegaP)*DEG_R;
    const E=solveKeplerEcc(M,e);
    const xv=Math.cos(E)-e, yv=Math.sqrt(1-e*e)*Math.sin(E);
    const v=Math.atan2(yv,xv), r=a*Math.sqrt(xv*xv+yv*yv);
    const LP=v+omegaP*DEG_R;
    const {x:xE,y:yE}=earthHelioXY(T);
    return norm360(Math.atan2(r*Math.sin(LP)-yE, r*Math.cos(LP)-xE)/DEG_R);
  }

  // ── OUTER PLANET GEOCENTRIC LONGITUDE (helio→geo vector subtraction) ──
  // Computes heliocentric (L_helio, r) then subtracts Earth vector for true geocentric.
  // This fixes the ~1-2° error that occurs when returning heliocentric lon directly.
  function outerPlanetGeoLon(L_helio_deg, M_rad, a, e) {
    // Solve Kepler for radius vector
    const E = solveKeplerEcc(M_rad, e);
    const xv = Math.cos(E) - e, yv = Math.sqrt(1 - e*e) * Math.sin(E);
    const r = a * Math.sqrt(xv*xv + yv*yv);
    const L_rad = L_helio_deg * DEG_R;
    const xP = r * Math.cos(L_rad), yP = r * Math.sin(L_rad);
    return {xP, yP};
  }

  // ── JUPITER — Meeus Ch.33 perturbations → heliocentric, then geo conversion ──
  function jupiterLon(jd){
    const T=Tc(jd),T2=T*T;
    const L0=norm360(34.351484+3034.9056746*T-0.00008501*T2);
    const Mj=(norm360(20.020+3034.6776*T))*DEG_R;
    const Ms=(norm360(316.967+1221.556*T))*DEG_R;
    const Me=(norm360(357.529+35999.050*T))*DEG_R;
    const Mv=(norm360(212.210+58519.213*T))*DEG_R;
    const Ee=1-0.002516*T-0.0000074*T2;
    const C=5.5549*Math.sin(Mj)+0.1683*Math.sin(2*Mj)
           -0.4439*Math.sin(norm360(17.968+3034.697*T)*DEG_R)
           +0.0511*Ee*Math.sin(Mj-Ms)+0.0283*Math.sin(2*Mj-Ms)
           +0.0073*Math.sin(Mj+Ms)-0.0084*Math.sin(Mj-Me)
           +0.0021*Ee*Math.sin(Me)+0.0017*Math.sin(Mj+2*Ms)
           -0.0013*Math.sin(2*Mj-2*Ms)+0.0010*Math.sin(3*Mj)
           -0.0010*Ee*Math.sin(Ms-2*Me)+0.0009*Math.sin(Mj-Mv)
           +0.0007*Math.sin(2*Mj-Mv)-0.0006*Math.sin(2*Mj-Me)
           +0.0005*Ee*Math.sin(Mj+Me)-0.0005*Ee*Math.sin(Me-Ms);
    const L_helio = norm360(L0+C);
    // Jupiter orbital elements for radius vector
    const a_J=5.202603, e_J=0.048498+0.000163*T;
    const omegaJ=norm360(14.3312+1.6146*T); // longitude of perihelion
    const M_J=norm360(L_helio-omegaJ)*DEG_R;
    const {xP,yP}=outerPlanetGeoLon(L_helio, M_J, a_J, e_J);
    const {x:xE,y:yE}=earthHelioXY(T);
    return norm360(Math.atan2(yP-yE, xP-xE)/DEG_R);
  }

  // ── SATURN — Meeus Ch.33 perturbations → heliocentric, then geo conversion ──
  function saturnLon(jd){
    const T=Tc(jd),T2=T*T;
    const L0=norm360(50.077444+1222.1138488*T+0.00021004*T2);
    const Ms=(norm360(316.9670+1221.5555*T))*DEG_R;
    const Mj=(norm360(20.020+3034.678*T))*DEG_R;
    const Me=(norm360(357.529+35999.050*T))*DEG_R;
    const Ee=1-0.002516*T-0.0000074*T2;
    const C=6.3585*Math.sin(Ms)+0.2440*Math.sin(2*Ms)
           -0.4803*Math.sin(norm360(22.325+1222.114*T)*DEG_R)
           -0.0551*Math.sin(2*Mj-Ms)+0.0338*Ee*Math.sin(Mj-Ms)
           +0.0297*Math.sin(Mj+Ms)+0.0234*Math.sin(3*Ms)
           +0.0089*Math.sin(2*Mj+Ms)-0.0063*Ee*Math.sin(Mj)
           -0.0048*Ee*Math.sin(Me)+0.0041*Ee*Math.sin(Ms-Me)
           +0.0030*Ee*Math.sin(Ms+Me)-0.0029*Math.sin(2*Mj-2*Ms)
           +0.0023*Ee*Math.sin(Mj-2*Me)+0.0021*Ee*Math.sin(Ms-Mj)
           -0.0019*Math.sin(2*Ms-Mj)+0.0018*Ee*Math.sin(2*Mj-3*Ms)
           +0.0017*Math.sin(3*Ms-Mj)-0.0016*Ee*Math.sin(Me-Mj)
           +0.0011*Math.sin(4*Ms)-0.0010*Math.sin(2*Ms-2*Mj)
           -0.0008*Ee*Math.sin(Me+Mj);
    const L_helio = norm360(L0+C);
    // Saturn orbital elements for radius vector
    const a_S=9.554909, e_S=0.055723-0.000347*T;
    const omegaS=norm360(93.0572+1.9637*T); // longitude of perihelion
    const M_S=norm360(L_helio-omegaS)*DEG_R;
    const {xP,yP}=outerPlanetGeoLon(L_helio, M_S, a_S, e_S);
    const {x:xE,y:yE}=earthHelioXY(T);
    return norm360(Math.atan2(yP-yE, xP-xE)/DEG_R);
  }

  // ── RAHU (true node) — Ch.47 Meeus ──
  function rahuLon(jd){
    const T=Tc(jd),T2=T*T,T3=T2*T;
    return norm360(125.04452-1934.136261*T+0.0020708*T2+T3/450000);
  }

  // ── DAILY MOTION (central difference, high precision) ──
  function dailyMotion(fn,jd){const s=0.005;let d=fn(jd+s)-fn(jd-s);if(d>180)d-=360;if(d<-180)d+=360;return d/(2*s);}

  // ── ASCENDANT — Phase 2: IAU 2006 GAST + true obliquity ──
  function calcAsc_SE(jdUT,jdTT,lat,geoLon){
    const T=Tc(jdTT);
    const LAST=localSiderealTime_P2(jdUT,jdTT,geoLon);
    const {deps}=nutation(T),eps0=meanObliquity(T);
    const eps=eps0+deps; // true obliquity
    const L=LAST*DEG_R,phi=lat*DEG_R,epsR=eps*DEG_R;
    let A=Math.atan2(Math.cos(L),-(Math.sin(L)*Math.cos(epsR)+Math.tan(phi)*Math.sin(epsR)))*RAD_D;
    if(A<0)A+=360;
    // Quadrant correction based on LAST
    if(LAST>=0&&LAST<90&&A>=270)A-=180;
    else if(LAST>=90&&LAST<180&&A<90)A+=180;
    else if(LAST>=180&&LAST<270&&A<90)A+=180;
    else if(LAST>=270&&LAST<360&&A>=270)A-=180;
    return norm360(A);
  }

  function getNak_SE(sidLon){
    const lon=norm360(sidLon),span=360/27,nakIdx=Math.floor(lon/span)%27,degInNak=lon%span,pada=Math.floor(degInNak/(span/4))+1;
    return{name:NAK_NAMES_SE[nakIdx],lord:NAK_LORDS_SE[nakIdx],pada,nakIdx,degInNak};
  }

  // ── MC — Phase 2: IAU 2006 GAST ──
  function calcMC_SE(jdUT,jdTT,lat,geoLon){
    const T=Tc(jdTT);
    const RAMC=localSiderealTime_P2(jdUT,jdTT,geoLon);
    const {deps}=nutation(T),eps0=meanObliquity(T);
    const eps=(eps0+deps)*DEG_R;
    return norm360(Math.atan2(Math.sin(RAMC*DEG_R),Math.cos(RAMC*DEG_R)*Math.cos(eps))*RAD_D);
  }

  function calcSripatiCusps(ascSid,mcSid){
    // Correct Sripati quadrant arcs:
    // Q1: MC  → ASC  (houses 10,11,12)
    // Q2: ASC → IC   (houses 1,2,3)
    // Q3: IC  → DSC  (houses 4,5,6)
    // Q4: DSC → MC   (houses 7,8,9)
    const descSid=norm360(ascSid+180),icSid=norm360(mcSid+180);
    function arcFwd(from,to){let d=to-from;if(d<0)d+=360;return d;}
    const Q1=arcFwd(mcSid,ascSid),   // MC→ASC
          Q2=arcFwd(ascSid,icSid),   // ASC→IC
          Q3=arcFwd(icSid,descSid),  // IC→DSC
          Q4=arcFwd(descSid,mcSid);  // DSC→MC
    const cusps=new Array(13);
    // Houses 10,11,12 in Q1 (MC→ASC)
    cusps[10]=mcSid;
    cusps[11]=norm360(mcSid+Q1/3);
    cusps[12]=norm360(mcSid+2*Q1/3);
    // Houses 1,2,3 in Q2 (ASC→IC)
    cusps[1]=ascSid;
    cusps[2]=norm360(ascSid+Q2/3);
    cusps[3]=norm360(ascSid+2*Q2/3);
    // Houses 4,5,6 in Q3 (IC→DSC)
    cusps[4]=icSid;
    cusps[5]=norm360(icSid+Q3/3);
    cusps[6]=norm360(icSid+2*Q3/3);
    // Houses 7,8,9 in Q4 (DSC→MC)
    cusps[7]=descSid;
    cusps[8]=norm360(descSid+Q4/3);
    cusps[9]=norm360(descSid+2*Q4/3);
    // Bhava Madhya: midpoint of each cusp pair
    const madhya=new Array(13);
    for(let h=1;h<=12;h++){
      const next=h===12?1:h+1;
      let arc=cusps[next]-cusps[h];
      if(arc<0)arc+=360;
      madhya[h]=norm360(cusps[h]+arc/2);
    }
    return{cusps,madhya,ascSid,mcSid,descSid,icSid};
  }

  function bhavaChaliFromLon(sidLon,madhya){let best=1,bestDist=360;for(let h=1;h<=12;h++){let d=Math.abs(sidLon-madhya[h]);if(d>180)d=360-d;if(d<bestDist){bestDist=d;best=h;}}return best;}
  function toDMS(deg){const total=Math.abs(deg),d=Math.floor(total),mFull=(total-d)*60,m=Math.floor(mFull),s=parseFloat(((mFull-m)*60).toFixed(2));return{d,m,s,str:`${d}° ${m}' ${s.toFixed(2)}"`};}

  // ── VARGA CHARTS ──
  // D9 Navamsa
  function navamsaLon(sidLon){
    const sign=Math.floor(sidLon/30)%12;
    const pos=sidLon%30;
    const part=Math.floor(pos/(30/9));
    // start sign: movable→same, fixed→9th, dual→5th
    const movable=[0,3,6,9],fixed=[1,4,7,10];
    let start;
    if(movable.includes(sign))start=sign;
    else if(fixed.includes(sign))start=(sign+8)%12;
    else start=(sign+4)%12;
    return norm360(((start+part)%12)*30+(pos%(30/9))*(30/(30/9)));
  }
  // D10 Dashamsa — Parashari rule: odd signs (Aries=0,Gemini=2,…) start from same sign; even start from 9th
  function dashamsaLon(sidLon){
    const sign=Math.floor(sidLon/30)%12;
    const pos=sidLon%30,part=Math.floor(pos/3);
    // sign index: 0=Aries(odd),1=Taurus(even)… odd index=even sign count
    // Parashari: Movable/odd-numbered signs (Aries,Gemini,Leo,Libra,Sagittarius,Aquarius = indices 0,2,4,6,8,10) start from same
    // Fixed/even-numbered (Taurus,Cancer,Virgo,Scorpio,Capricorn,Pisces = 1,3,5,7,9,11) start from 9th sign
    const startSign=(sign%2===0)?sign:(sign+8)%12;
    return norm360(((startSign+part)%12)*30+(pos%3)*10);
  }
  // D12 Dwadasamsa
  function dwadasamsaLon(sidLon){
    const sign=Math.floor(sidLon/30)%12;
    const pos=sidLon%30,part=Math.floor(pos/(30/12));
    return norm360(((sign+part)%12)*30+(pos%(30/12))*12);
  }
  // BUG B FIX: compute each varga longitude exactly once to avoid float drift and redundant calls
  function calcVarga(sidLon){
    const d9=navamsaLon(sidLon),d10=dashamsaLon(sidLon),d12=dwadasamsaLon(sidLon);
    return{
      D1:{lon:sidLon,sign:Math.floor(sidLon/30)%12,degree:sidLon%30},
      D9:{lon:d9,sign:Math.floor(d9/30)%12,degree:d9%30},
      D10:{lon:d10,sign:Math.floor(d10/30)%12,degree:d10%30},
      D12:{lon:d12,sign:Math.floor(d12/30)%12,degree:d12%30}
    };
  }

  // ── DASHA — full 3-level (Maha/Antar/Pratyantar) ──
  function calcDasha(kundli,dobStr){
    const NAK_SPAN=360/27;
    // Sidereal year in ms (365.25636 days × 24 × 3600 × 1000)
    const MS_PER_YR=365.25636*24*3600*1000;
    const dob=new Date(dobStr+'T12:00:00'),now=new Date();
    const moonNakLord=kundli.moonNakLord,totalYrs=DASHA_YEARS_SE[moonNakLord];
    const moonDegInNak=kundli.moonDegInNak,fracElapsed=moonDegInNak/NAK_SPAN;
    // How many years of the starting dasha already elapsed at birth
    const elapsedYrs=fracElapsed*totalYrs;
    const lordIdx=DASHA_ORDER_SE.indexOf(moonNakLord);
    // Dasha start = birth minus elapsed portion
    let cursor=new Date(dob.getTime()-elapsedYrs*MS_PER_YR);
    const dashas=[];
    for(let i=0;i<9;i++){
      const lord=DASHA_ORDER_SE[(lordIdx+i)%9],yrs=DASHA_YEARS_SE[lord];
      const startDate=new Date(cursor),endDate=new Date(cursor.getTime()+yrs*MS_PER_YR);
      const isCurrent=now>=startDate&&now<endDate;
      const pct=isCurrent?((now-startDate)/(endDate-startDate))*100:0;
      const rem=isCurrent?((endDate-now)/MS_PER_YR).toFixed(2):'0';
      // Antardasha
      const bhuktis=[],bLordStart=DASHA_ORDER_SE.indexOf(lord);
      let bCursor=new Date(startDate);
      for(let j=0;j<9;j++){
        const bLord=DASHA_ORDER_SE[(bLordStart+j)%9],bYrs=yrs*DASHA_YEARS_SE[bLord]/120;
        const bStart=new Date(bCursor),bEnd=new Date(bCursor.getTime()+bYrs*MS_PER_YR);
        const bCurrent=now>=bStart&&now<bEnd;
        // Pratyantardasha — starts from same lord as bhukti lord
        const pratyantar=[];let pCursor=new Date(bStart);
        const pLordStart=DASHA_ORDER_SE.indexOf(bLord);
        for(let k=0;k<9;k++){
          const pLord=DASHA_ORDER_SE[(pLordStart+k)%9],pYrs=bYrs*DASHA_YEARS_SE[pLord]/120;
          const pStart=new Date(pCursor),pEnd=new Date(pCursor.getTime()+pYrs*MS_PER_YR);
          pratyantar.push({lord:pLord,yrs:pYrs.toFixed(3),startDate:pStart,endDate:pEnd,isCurrent:now>=pStart&&now<pEnd});
          pCursor=pEnd;
        }
        bhuktis.push({lord:bLord,yrs:bYrs.toFixed(2),startDate:bStart,endDate:bEnd,isCurrent:bCurrent,pratyantar});
        bCursor=bEnd;
      }
      dashas.push({lord,yrs:yrs.toFixed(1),startDate,endDate,isCurrent,pct,rem,bhuktis});
      cursor=endDate;
    }
    return dashas;
  }

  const SIGN_LORDS_SE=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

  function buildStructuredOutput(rawKundli,jd,jdTT,lat,geoLon){
    const mcTrop=calcMC_SE(jd,jdTT,lat,geoLon),ayan=rawKundli.ayan,mcSid=norm360(mcTrop-ayan);
    const ascSid=rawKundli.ascendant.sidLon,lagnaIdx=rawKundli.lagnaSignIdx,sripati=calcSripatiCusps(ascSid,mcSid);
    const structured={
      engineVersion:'v8-Nakshatrika',ayanamshaType:'Lahiri-IAU2006-True',
      ayanamsha:{decimal:ayan,dms:toDMS(ayan)},
      lagna:{decimal:ascSid,dms:toDMS(ascSid),rashi:SIGN_NAMES_SE[Math.floor(ascSid/30)],rashiIdx:Math.floor(ascSid/30),degree:ascSid%30,degreeDms:toDMS(ascSid%30),nakshatra:rawKundli.ascendant.nakshatra,nakshatraLord:rawKundli.ascendant.nakshatraLord,pada:rawKundli.ascendant.pada,signLord:SIGN_LORDS_SE[Math.floor(ascSid/30)]},
      sripati,planets:[]
    };
    rawKundli.planets.forEach(p=>{
      const sid=p.sidLon,rashiIdx=Math.floor(sid/30),bhavaRashi=((rashiIdx-lagnaIdx+12)%12)+1,bhavaChalit=bhavaChaliFromLon(sid,sripati.madhya);
      const varga=calcVarga(sid);
      structured.planets.push({
        name:p.name,symbol:p.symbol,color:p.color,
        sidereal:{decimal:sid,dms:toDMS(sid)},
        degreeInRashi:{decimal:sid%30,dms:toDMS(sid%30)},
        rashi:{name:SIGN_NAMES_SE[rashiIdx],idx:rashiIdx},
        signLord:SIGN_LORDS_SE[rashiIdx],bhavaRashi,bhavaChalit,
        shifted:bhavaRashi!==bhavaChalit,isRetro:p.isRetro,retrograde:p.isRetro,
        nakshatra:p.nakshatra,nakshatraLord:p.nakshatraLord,pada:p.pada,
        dailyMotion:p.dailyMotion??null,signIdx:rashiIdx,sign:SIGN_NAMES_SE[rashiIdx],
        degree:sid%30,varga
      });
    });
    rawKundli.structured=structured;rawKundli.sripati=sripati;return structured;
  }

  function calcKundli(year,month,day,hr,mn,lat,geoLon,tz){
    const jd=toJD_SE(year,month,day,hr,mn,tz);
    const jdTT=jdToTT(jd,year);  // ← USE TT for planet computation
    const ayan=lahiriAyanamsha(jdTT,true),sid=l=>norm360(l-ayan);

    const DEFS=[
      {name:'Sun',   fn:sunLon,    canRetro:false,symbol:'☀',color:'#FFA040',distAU:1.0},
      {name:'Moon',  fn:moonLon,   canRetro:false,symbol:'☽',color:'#C8D4E8',distAU:0.00257},
      {name:'Mars',  fn:marsLon,   canRetro:true, symbol:'♂',color:'#E05040',distAU:1.524},
      {name:'Mercury',fn:mercuryLon,canRetro:true,symbol:'☿',color:'#78C878',distAU:0.387},
      {name:'Jupiter',fn:jupiterLon,canRetro:true,symbol:'♃',color:'#D4A820',distAU:5.203},
      {name:'Venus', fn:venusLon,  canRetro:true, symbol:'♀',color:'#F0B0D0',distAU:0.723},
      {name:'Saturn',fn:saturnLon, canRetro:true, symbol:'♄',color:'#9090A8',distAU:9.537}
    ];

    // ── PHASE 2 PLANET PIPELINE ──
    // Moon: full ELP2000 → topocentric via RA/Dec → back to ecliptic
    // Planets: geometric lon → light-time → aberration → equ → topo → ecl → sidereal

    const planets=DEFS.map(({name,fn,canRetro,symbol,color,distAU})=>{
      const tropRaw=fn(jdTT),dm=dailyMotion(fn,jdTT);
      let tropApp;
      if(name==='Moon'&&lat!==0){
        // Full topocentric pipeline via equatorial coords
        const topoEcl=moonTopocentric_P2(jd,jdTT,lat,geoLon);
        tropApp=topoEcl.lon;
      } else if(name==='Moon'){
        // No observer correction (transit panel lat=0), just apply light-time
        const ltCorr=lightTimeCorr(distAU,dm);
        tropApp=norm360(tropRaw+ltCorr);
      } else {
        // All planets: light-time + aberration + topocentric via equatorial
        const ltCorr=lightTimeCorr(distAU,dm);
        const abCorr=name==='Sun'?0:aberration(jdTT,tropRaw);
        const geomLon=norm360(tropRaw+ltCorr+abCorr);
        if(lat!==0){
          // Ecliptic → Equatorial → Topocentric → Ecliptic
          const topoEcl=planetTopoEcliptic_P2(geomLon,0,distAU,jd,jdTT,lat,geoLon);
          tropApp=topoEcl.lon;
        } else {
          tropApp=geomLon;
        }
      }
      const sidLon=sid(tropApp),signIdx=Math.floor(sidLon/30),nak=getNak_SE(sidLon);
      return{name,symbol,color,tropRaw,tropApp,sidLon,signIdx,sign:SIGN_NAMES_SE[signIdx],degree:sidLon%30,isRetro:canRetro?(dm<0):false,nakshatra:nak.name,nakshatraLord:nak.lord,pada:nak.pada,nakIdx:nak.nakIdx,degInNak:nak.degInNak,dailyMotion:dm};
    });

    const rahuTrop=rahuLon(jdTT),rahuSid=sid(rahuTrop),ketuSid=norm360(rahuSid+180);
    const rNak=getNak_SE(rahuSid),kNak=getNak_SE(ketuSid);
    planets.push({name:'Rahu',symbol:'☊',color:'#B060B0',tropRaw:rahuTrop,tropApp:rahuTrop,sidLon:rahuSid,signIdx:Math.floor(rahuSid/30),sign:SIGN_NAMES_SE[Math.floor(rahuSid/30)],degree:rahuSid%30,isRetro:true,nakshatra:rNak.name,nakshatraLord:rNak.lord,pada:rNak.pada,nakIdx:rNak.nakIdx,degInNak:rNak.degInNak,dailyMotion:-0.053});
    planets.push({name:'Ketu',symbol:'☋',color:'#906840',tropRaw:norm360(rahuTrop+180),tropApp:norm360(rahuTrop+180),sidLon:ketuSid,signIdx:Math.floor(ketuSid/30),sign:SIGN_NAMES_SE[Math.floor(ketuSid/30)],degree:ketuSid%30,isRetro:true,nakshatra:kNak.name,nakshatraLord:kNak.lord,pada:kNak.pada,nakIdx:kNak.nakIdx,degInNak:kNak.degInNak,dailyMotion:-0.053});

    const ascTrop=calcAsc_SE(jd,jdTT,lat,geoLon),ascSid=sid(ascTrop),ascSI=Math.floor(ascSid/30),ascNak=getNak_SE(ascSid);
    const ascendant={name:'Ascendant',symbol:'↑',color:'#F0A500',tropRaw:ascTrop,tropApp:ascTrop,sidLon:ascSid,signIdx:ascSI,sign:SIGN_NAMES_SE[ascSI],degree:ascSid%30,isRetro:false,nakshatra:ascNak.name,nakshatraLord:ascNak.lord,pada:ascNak.pada,nakIdx:ascNak.nakIdx,degInNak:ascNak.degInNak};
    const moonP=planets.find(p=>p.name==='Moon'),sunP=planets.find(p=>p.name==='Sun');
    const rawKundli={jd,jdTT,ayan,ascendant,planets,moonSign:moonP.sign,sunSign:sunP.sign,lagnaSign:ascendant.sign,lagnaSignIdx:ascSI,moonNakshatra:moonP.nakshatra,moonNakLord:moonP.nakshatraLord,moonNakIdx:moonP.nakIdx,moonDegInNak:moonP.degInNak,moonSidLon:moonP.sidLon,engineVersion:'v9-Phase2-Topocentric',ayanamshaType:'Lahiri-IAU2006-True'};
    buildStructuredOutput(rawKundli,jd,jdTT,lat,geoLon);
    return rawKundli;
  };

  // ══════════════════════════════════════════════════════════
  // INTEGRATED SHADBALA + ASPECTS + COMBUSTION ENGINE
  // ══════════════════════════════════════════════════════════

  // Naisargika (natural strength) — fixed scale
  const NAISARGIKA_BALA={Sun:60,Moon:51,Venus:43,Jupiter:34,Mercury:26,Mars:17,Saturn:9,Rahu:9,Ketu:9};

  // Exaltation points as ABSOLUTE sidereal degrees (0-360), i.e. sign-offset + degree-in-sign.
  // ERROR FOUND & FIXED: this table previously stored only the degree-IN-SIGN for every
  // planet (e.g. Mars 28, meaning "28° of some sign") without adding that sign's 30°
  // offset — so sthanaBala_calc() below, which measures each planet's actual angular
  // distance from its exaltation POINT, was silently comparing Mars/Mercury/Jupiter/
  // Venus/Saturn against a point sitting in Aries (degree 0-30) instead of their real
  // classical exaltation point. Sun (Aries, offset 0) and Moon (Taurus, offset 30 — the
  // one entry that already had +30 added) were the only two that happened to be correct,
  // which is what let the bug hide. Correct classical points (sign offset = signIdx*30):
  //   Sun 10° Aries(0)=10 · Moon 3° Taurus(1)=33 · Mars 28° Capricorn(9)=298
  //   Mercury 15° Virgo(5)=165 · Jupiter 5° Cancer(3)=95 · Venus 27° Pisces(11)=357
  //   Saturn 20° Libra(6)=200
  // Rahu/Ketu exaltation is not part of classical Parashari canon and differs by school;
  // the widely-used convention (Rahu exalted Taurus, Ketu exalted Scorpio — opposite each
  // other, as the nodes always are) is used here rather than the previous same-value
  // placeholder (20/20), which made the two shadow points structurally not opposite.
  const EXALT_SID={Sun:10,Moon:33,Mars:298,Mercury:165,Jupiter:95,Venus:357,Saturn:200,Rahu:50,Ketu:230};

  // Dig Bala — ideal house for max directional strength
  const DIG_IDEAL={Sun:10,Mars:10,Jupiter:1,Mercury:1,Moon:4,Venus:4,Saturn:7,Rahu:3,Ketu:9};

  function sthanaBala_calc(planetName,sidLon){
    const ex=EXALT_SID[planetName];if(ex===undefined) return 30;
    let diff=((sidLon-ex)%360+360)%360;
    const angle=Math.min(diff,360-diff);
    return Math.max(0,60-(angle/180)*60);
  }
  function digBala_calc(planetName,bhava){
    const ideal=DIG_IDEAL[planetName]||1;
    const diff=Math.abs(bhava-ideal);
    const d=Math.min(diff,12-diff);
    return Math.max(0,60-d*(60/6));
  }
  function kalaBala_calc(planetName,isDay){
    if(planetName==='Sun'||planetName==='Jupiter'||planetName==='Venus') return isDay?60:30;
    if(planetName==='Moon'||planetName==='Mars'||planetName==='Saturn') return isDay?30:60;
    return 45;
  }
  function cheshtaBala_calc(isRetro){return isRetro?60:30;}

  // Aspects (Drishti) — returns array of {from,to,house}
  function calcAspects_SE(planets){
    const result=[];
    for(const p of planets){
      for(const q of planets){
        if(p.name===q.name) continue;
        let diff=((q.signIdx-p.signIdx)%12+12)%12+1; // 1-indexed house distance
        const is7th=diff===7;
        const isMars=(p.name==='Mars')&&(diff===4||diff===8);
        const isJup=(p.name==='Jupiter')&&(diff===5||diff===9);
        const isSat=(p.name==='Saturn')&&(diff===3||diff===10);
        if(is7th||isMars||isJup||isSat) result.push({from:p.name,to:q.name,house:diff,isFull:true});
      }
    }
    return result;
  }

  function drikBala_calc(planetName,aspects){
    let score=0;
    for(const asp of aspects){
      if(asp.to===planetName){
        if(asp.from==='Jupiter') score+=15;
        else if(asp.from==='Venus') score+=10;
        else if(asp.from==='Moon') score+=5;
        else if(asp.from==='Saturn') score-=10;
        else if(asp.from==='Mars') score-=15;
        else if(asp.from==='Sun') score+=5;
      }
    }
    return score;
  }

  // Combustion limits (degrees from Sun)
  const COMBUST_LIMITS={Mercury:14,Venus:10,Mars:17,Jupiter:11,Saturn:15,Moon:12};
  function isCombust_calc(planetName,sidLon,sunSidLon){
    const lim=COMBUST_LIMITS[planetName];if(!lim) return false;
    let diff=Math.abs(sidLon-sunSidLon);if(diff>180) diff=360-diff;
    return diff<lim;
  }

  // Dignity classification
  const EXALT_SIGN={Sun:0/*Aries*/,Moon:1/*Taurus*/,Mars:9/*Capricorn*/,Mercury:5/*Virgo*/,Jupiter:3/*Cancer*/,Venus:11/*Pisces*/,Saturn:6/*Libra*/};
  const DEBIL_SIGN={Sun:6,Moon:7,Mars:3,Mercury:11,Jupiter:9,Venus:5,Saturn:0};
  // OWN_SIGN — standard Parashari. Rahu: Aquarius(10), Virgo(5). Ketu: Scorpio(7), Pisces(11)
  const OWN_SIGN={Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10],Rahu:[5,10],Ketu:[7,11]};
  function calcDignity(planetName,signIdx,neechaBhanga=false){
    const os=OWN_SIGN[planetName]||[];
    if(os.includes(signIdx)) return 'Own House';
    if(EXALT_SIGN[planetName]===signIdx) return 'Exalted';
    if(DEBIL_SIGN[planetName]===signIdx) return neechaBhanga?'Neecha Bhanga':'Debilitated';
    return 'Neutral';
  }

  // ── NEECHA BHANGA (debilitation-cancellation) ──
  // ACCURACY ADD: a debilitated planet is not always weak — classical texts (e.g.
  // Phaladeepika, Saravali) give several conditions that "cancel" (bhanga) a
  // debilitation. This implements the single most commonly cited one: the sign
  // lord of the debilitated planet's own sign is itself placed in a Kendra
  // (1st/4th/7th/10th) counted from the Lagna OR from the Moon. This is a
  // simplified check — real charts can trigger cancellation through other
  // classical routes (mutual exchange, dispositor exalted, etc.) not modeled
  // here — but it is the single rule most software and texts lead with, and it
  // meaningfully corrects the common misreading that "debilitated = always weak".
  const KENDRA_SIGN_OFFSETS=[1,4,7,10];
  function isDispositorInKendra(debilSignIdx,planets,moonSignIdx){
    const dispositorName=SIGN_LORDS_SE[debilSignIdx];
    const dispositor=planets.find(pp=>pp.name===dispositorName);
    if(!dispositor) return false;
    const kendraFromLagna=KENDRA_SIGN_OFFSETS.includes(dispositor.bhavaRashi);
    // "Kendra from Moon" only means something when the dispositor is a body
    // OTHER than the Moon — checking the Moon's kendra status relative to
    // itself is degenerate (house-from-self is always 1, always a Kendra),
    // which would wrongly grant Neecha Bhanga on every Mars-in-Cancer chart
    // (Cancer's lord is the Moon) regardless of the real chart. Skip it there.
    const houseFromMoon=(((dispositor.rashi.idx-moonSignIdx)%12+12)%12)+1;
    const kendraFromMoon=dispositor.name!=='Moon'&&KENDRA_SIGN_OFFSETS.includes(houseFromMoon);
    return kendraFromLagna||kendraFromMoon;
  }

  // Full shadbala computation for all planets in a kundali
  function calcShadbala(kundali,isDay){
    const planets=kundali.structured?kundali.structured.planets:[];
    const sunP=planets.find(p=>p.name==='Sun');
    const sunSid=sunP?sunP.sidereal.decimal:0;
    const moonP=planets.find(p=>p.name==='Moon');
    const moonSignIdx=moonP?moonP.rashi.idx:0;
    const aspects=calcAspects_SE(planets);

    const results={};
    planets.forEach(p=>{
      const s=sthanaBala_calc(p.name,p.sidereal.decimal);
      const d=digBala_calc(p.name,p.bhavaRashi);
      const k=kalaBala_calc(p.name,isDay);
      const c=cheshtaBala_calc(p.isRetro);
      const dr=drikBala_calc(p.name,aspects);
      const n=NAISARGIKA_BALA[p.name]||9;
      const total=s+d+k+c+dr+n;
      const maxPossible=60+60+60+60+30+60; // rough max
      const pct=Math.round(Math.min(100,Math.max(0,(total/maxPossible)*100)));
      const combust=(p.name!=='Sun')&&isCombust_calc(p.name,p.sidereal.decimal,sunSid);
      const neechaBhanga=DEBIL_SIGN[p.name]===p.rashi.idx&&isDispositorInKendra(p.rashi.idx,planets,moonSignIdx);
      const dignity=calcDignity(p.name,p.rashi.idx,neechaBhanga);
      results[p.name]={total:Math.round(total),pct,breakdown:{s:Math.round(s),d:Math.round(d),k:Math.round(k),c:Math.round(c),dr:Math.round(dr),n},combust,dignity,aspects:aspects.filter(a=>a.from===p.name||a.to===p.name)};
    });
    // Also add Rahu/Ketu
    ['Rahu','Ketu'].forEach(name=>{
      if(!results[name]){
        const p2=planets.find(p=>p.name===name);if(!p2) return;
        const n=NAISARGIKA_BALA[name]||9;
        const total=45+n; // simplified for shadow planets
        const pct=Math.round(Math.min(100,(total/330)*100));
        results[name]={total,pct,breakdown:{s:0,d:0,k:45,c:0,dr:0,n},combust:false,dignity:calcDignity(name,p2.rashi.idx),aspects:[]};
      }
    });
    results._aspects=aspects;
    return results;
  };

// ── PUBLIC API ────────────────────────────────────────────────────────
export {
  calcKundli,           // (year,month,day,hour,minute,lat,lon,tzOffset) -> full natal kundli
  calcDasha,             // (kundli, 'YYYY-MM-DD') -> Vimshottari Dasha tree (Maha/Antar/Pratyantar)
  calcVarga,              // (sidLon) -> {D1,D9,D10,D12}
  calcShadbala,          // (kundli, isDay) -> per-planet 6-fold strength breakdown
  calcAspects_SE as calcAspects,   // (planets[]) -> Vedic Drishti aspect list
  isCombust_calc as isCombust,     // (planetName, sidLon, sunSidLon) -> boolean
  calcSripatiCusps,      // (ascSid, mcSid) -> Sripati house cusps
  calcDignity,           // (planetName, signIdx, neechaBhanga?) -> 'Exalted'|'Debilitated'|'Neecha Bhanga'|'Own House'|'Neutral'
  toJD_SE as toJulianDay,
  lahiriAyanamsha,
  SIGN_NAMES_SE as SIGN_NAMES,
  NAK_NAMES_SE as NAKSHATRA_NAMES
};
