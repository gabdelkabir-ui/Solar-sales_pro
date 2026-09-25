import React from 'react';
// Font Awesome
import { FaLightbulb, FaBatteryFull, FaBolt, FaVolumeUp, FaMicrophone, FaHardHat, FaCompressArrowsAlt, FaCoffee, FaHotTub, FaSnowflake, FaWind, FaTint, FaCashRegister, FaHandPointer, FaCreditCard, FaMobileAlt, FaSolarPanel, FaStethoscope, FaCube, FaTv, FaPlusCircle, FaToolbox } from 'react-icons/fa';
// Material Design Icons
import { MdExplore, MdKitchen, MdCable, MdChargingStation, MdSettingsRemote, MdSmartToy } from 'react-icons/md';
// Bootstrap Icons
import { BsFan } from 'react-icons/bs';
// Tabler Icons
import { TbDrone, TbRouter, TbAntennaBars5, TbRadar2, TbDeviceDesktop } from 'react-icons/tb';
// Feather Icons
import { FiMonitor, FiHardDrive, FiWifi, FiPrinter, FiTablet, FiVolume2, FiCloud } from 'react-icons/fi';
// Remix Icons
import { RiVideoLine, RiEqualizerLine, RiPenNibLine, RiContrast2Line } from 'react-icons/ri';
// Ant Design Icons
import { AiOutlineCamera, AiOutlineDesktop, AiOutlineThunderbolt, AiOutlineBulb } from 'react-icons/ai';
// Ionicons
import { IoVideocam, IoCamera, IoBulb, IoHeartCircle } from 'react-icons/io5';

export const getEquipmentIcon = (iconName: string, size: number = 20): React.ReactNode => {
  switch (iconName) {
    case 'Videocam': return <IoVideocam size={size} />;
    case 'CameraAlt': return <AiOutlineCamera size={size} />;
    case 'Camera': return <IoCamera size={size} />;
    case 'FiberManualRecord': return <RiVideoLine size={size} />;
    case 'Monitor': return <FiMonitor size={size} />;
    case 'MonitorHeart': return <IoHeartCircle size={size} />;
    case 'DisplaySettings': return <TbDeviceDesktop size={size} />;
    case 'Laptop': return <FiVolume2 size={size} />;
    case 'DesktopWindows': return <AiOutlineDesktop size={size} />;
    case 'Storage': return <FiHardDrive size={size} />;
    case 'Router': return <FiWifi size={size} />;
    case 'Satellite': return <TbRouter size={size} />;
    case 'Cable': return <MdCable size={size} />;
    case 'NetworkCheck': return <TbAntennaBars5 size={size} />;
    case 'Light': return <FaLightbulb size={size} />;
    case 'BatteryChargingFull': return <FaBatteryFull size={size} />;
    case 'Bolt': return <FaBolt size={size} />;
    case 'ChargingStation': return <MdChargingStation size={size} />;
    case 'ElectricalServices': return <AiOutlineThunderbolt size={size} />;
    case 'Print': return <FiPrinter size={size} />;
    case 'VolumeUp': return <FaVolumeUp size={size} />;
    case 'Mic': return <FaMicrophone size={size} />;
    case 'Tune': return <RiEqualizerLine size={size} />;
    case 'Radio': return <TbRadar2 size={size} />;
    case 'Tablet': return <FiTablet size={size} />;
    case 'Explore': return <MdExplore size={size} />;
    case 'Flight': return <TbDrone size={size} />;
    case 'Construction': return <FaHardHat size={size} />;
    case 'Compress': return <FaCompressArrowsAlt size={size} />;
    case 'CleaningServices': return <BsFan size={size} />;
    case 'Kitchen': return <MdKitchen size={size} />;
    case 'Cooktop': return <IoBulb size={size} />;
    case 'CoffeeMaker': return <FaCoffee size={size} />;
    case 'HotTub': return <FaHotTub size={size} />;
    case 'AcUnit': return <FaSnowflake size={size} />;
    case 'Air': return <FaWind size={size} />;
    case 'Waves': return <FaTint size={size} />;
    case 'PointOfSale': return <FaCashRegister size={size} />;
    case 'TouchApp': return <FaHandPointer size={size} />;
    case 'CreditCard': return <FaCreditCard size={size} />;
    case 'Smartphone': return <FaMobileAlt size={size} />;
    case 'SolarPower': return <FaSolarPanel size={size} />;
    case 'SmartToy': return <MdSmartToy size={size} />;
    case 'Cloud': return <FiCloud size={size} />;
    case 'MedicalServices': return <FaStethoscope size={size} />;
    case 'SettingsRemote': return <MdSettingsRemote size={size} />;
    case 'ViewInAr': return <FaCube size={size} />;
    case 'Tv': return <FaTv size={size} />;
    case 'Draw': return <RiPenNibLine size={size} />;
    case 'AddCircleOutline': return <FaPlusCircle size={size} />;
    case 'LinearScale': return <RiContrast2Line size={size} />;
    case 'Straighten': return <FaToolbox size={size} />;
    case 'Projector': return <AiOutlineBulb size={size} />;
    default: return <FiMonitor size={size} />;
  }
};