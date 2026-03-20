import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { validateCandidate, validateEmail, validatePhone } from '../utils/validation';
import { normalizeCity } from '../utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from '../utils/sourceNormalizer';
import { normalizeInterestAreasString, getMainInterestAreasOptions } from '../utils/interestAreaNormalizer';
import { normalizeChildrenForStorage, CHILDREN_OPTIONS } from '../utils/childrenNormalizer';
import { validateBirthDate } from '../utils/validation';
import { getAllRSCities, searchRSCities } from '../utils/rsCities';
import { Loader2, CheckCircle, AlertCircle, Send, ChevronRight, ChevronLeft, Link as LinkIcon, FileText, Check, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

// Dados realistas para preencher o formulário em modo teste (camelCase, datas DD/MM/YYYY)
const getTestFormData = () => {
  const ts = Date.now();
  return {
    fullName: 'Maria Fernanda Silva Santos',
    email: `teste.cadastro.${ts}@exemplo.com.br`,
    email_secondary: 'maria.fernanda.pessoal@gmail.com',
    phone: '(51) 99876-5432',
    birthDate: '15/05/1992',
    age: '32',
    maritalStatus: 'Casado(a)',
    childrenCount: '2',
    hasLicense: 'Sim',
    city: 'Porto Alegre/RS',
    cityCustom: '',
    photoUrl: '',
    photoFile: null,
    photoDriveUrl: '',
    photoType: 'url',
    education: 'Engenharia Civil',
    schoolingLevel: 'Superior Completo',
    institution: 'Universidade Federal do Rio Grande do Sul',
    graduationDate: '20/12/2015',
    isStudying: 'Não',
    experience: '5 anos em obras de infraestrutura. Atuação em coordenação de equipe e acompanhamento de cronograma. Experiência com obras públicas e privadas.',
    courses: 'Gestão de Projetos (FGV), BIM Básico (SENAC)',
    certifications: 'CREA-RS ativo, PMP em andamento',
    interestAreas: 'Engenharia, Gestão de Projetos, Obras',
    source: 'LinkedIn',
    sourceCustom: '',
    referral: 'João da Silva (colaborador Young)',
    salaryExpectation: 'R$ 12.000,00',
    canRelocate: 'Sim',
    references: 'Carlos Mendes - Eng. Coordenador - Construtora XYZ - (51) 3333-4444. Ana Costa - Diretora - Empresa ABC.',
    typeOfApp: 'Banco de Talentos',
    freeField: 'Busco oportunidade de atuar em projetos de grande porte. Tenho disponibilidade para viagens e grande interesse em desenvolvimento na área de gestão.',
    cvUrl: 'https://drive.google.com/exemplo-curriculo-maria',
    cvFile: null,
    cvDriveUrl: '',
    cvType: 'url',
    portfolioUrl: '',
    portfolioFile: null,
    portfolioDriveUrl: '',
    portfolioType: 'url'
  };
};

const PublicCandidateForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState({
    // Identificação e Contato
    fullName: '',
    email: '',
    email_secondary: '',
    phone: '',
    
    // Dados Pessoais
    birthDate: '',
    age: '',
    maritalStatus: '',
    childrenCount: '',
    hasLicense: '',
    city: '',
    cityCustom: '',
    photoUrl: '',
    
    // Formação e Experiência
    education: '',
    schoolingLevel: '',
    institution: '',
    graduationDate: '',
    isStudying: '',
    experience: '',
    courses: '',
    certifications: '',
    interestAreas: [],
    interestAreasOther: '',
    
    // Processo e Fit Cultural
    source: '',
    sourceCustom: '',
    referral: '',
    salaryExpectation: '',
    canRelocate: '',
    references: '',
    typeOfApp: '',
    freeField: '',
    
    // Anexos
    cvUrl: '',
    portfolioUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({}); // Erros em tempo real
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  /** null = ainda não checou; true/false via RPC (sem listar a base de candidatos) */
  const [publicEmailExists, setPublicEmailExists] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCityCustom, setShowCityCustom] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showSourceCustom, setShowSourceCustom] = useState(false);
  const [filteredCities, setFilteredCities] = useState(getAllRSCities().slice(0, 50));
  const [citiesFromDB, setCitiesFromDB] = useState([]);
  const cityInputRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const [showInterestAreasOther, setShowInterestAreasOther] = useState(false);
  
  // Domínios permitidos para uploads
  const ALLOWED_DOMAINS = [
    'drive.google.com',
    'dropbox.com',
    'icloud.com',
    'onedrive.live.com',
    'onedrive.com',
    'box.com',
    'wetransfer.com',
    'mediafire.com'
  ];

  // Validar se a URL é de um domínio permitido
  const validateAllowedDomain = (url) => {
    if (!url || url.trim() === '') return { valid: true, message: '' };
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Verificar se o domínio está na lista permitida
      const isAllowed = ALLOWED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        return {
          valid: false,
          message: `URL não permitida. Use links públicos de: Google Drive, Dropbox, iCloud, OneDrive, Box, WeTransfer ou MediaFire.`
        };
      }
      
      return { valid: true, message: '' };
    } catch (e) {
      return { valid: false, message: 'URL inválida' };
    }
  };

  // Duplicidade de e-mail: RPC segura (não expõe lista de candidatos)
  useEffect(() => {
    const email = formData.email?.trim();
    if (!email || !validateEmail(email).valid) {
      setPublicEmailExists(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('public_candidate_email_exists', { p_email: email });
        if (!cancelled && !error) setPublicEmailExists(data === true);
        if (!cancelled && error) setPublicEmailExists(null);
      } catch {
        if (!cancelled) setPublicEmailExists(null);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [formData.email]);

  // Carregar cidades do banco (schema young_talents; anon com política de leitura na migration 028)
  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .schema('young_talents')
          .from('cities')
          .select('*')
          .order('name');
        
        if (error) {
          console.warn('Erro ao carregar cidades do banco:', error);
          // Se não houver cidades no banco, usar lista padrão do RS
          const rsCities = getAllRSCities();
          setCitiesFromDB(rsCities.map((cityName, idx) => ({
            id: `rs_${idx}`,
            name: cityName // Já está no formato "Cidade/RS"
          })));
        } else {
          // Se houver cidades no banco, usar elas
          if (data && data.length > 0) {
            setCitiesFromDB(data);
          } else {
            // Se não houver cidades, usar lista padrão do RS como fallback
            const rsCities = getAllRSCities();
            setCitiesFromDB(rsCities.map((cityName, idx) => ({
              id: `rs_${idx}`,
              name: cityName // Já está no formato "Cidade/RS"
            })));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cidades:', error);
        // Fallback para lista do RS
        const rsCities = getAllRSCities();
        setCitiesFromDB(rsCities.map((cityName, idx) => ({
          id: `rs_${idx}`,
          name: cityName // Já está no formato "Cidade/RS"
        })));
      }
    };
    loadCities();
  }, []);

  // Converter data de formato DD/MM/YYYY para YYYY-MM-DD
  const convertDateToISO = (dateStr) => {
    if (!dateStr) return '';
    
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Se está no formato DD/MM/YYYY, converte
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
        // Valida a data
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // Tenta parsear como data válida
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  };

  // Buscar cidades quando termo de busca muda
  useEffect(() => {
    if (citySearchTerm.trim() === '') {
      setFilteredCities(getAllRSCities().slice(0, 50));
    } else {
      setFilteredCities(searchRSCities(citySearchTerm));
    }
  }, [citySearchTerm]);

  // Cidades filtradas para o combobox (citiesFromDB + termo digitado)
  const cityOptionsFiltered = useMemo(() => {
    if (!citiesFromDB.length) return [];
    const term = citySearchTerm.trim().toLowerCase();
    if (!term) return citiesFromDB.slice(0, 80);
    return citiesFromDB.filter((city) => {
      const name = (city.name || '').toLowerCase();
      return name.includes(term);
    }).slice(0, 80);
  }, [citiesFromDB, citySearchTerm]);

  // Fechar dropdown de cidade ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target) &&
          cityInputRef.current && !cityInputRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular idade automaticamente quando data de nascimento muda
  useEffect(() => {
    if (formData.birthDate) {
      // Converte para formato ISO se necessário
      const isoDate = convertDateToISO(formData.birthDate);
      if (isoDate) {
        const birthResult = validateBirthDate(isoDate);
        if (birthResult.valid && birthResult.age) {
          setFormData(prev => ({ ...prev, age: birthResult.age.toString() }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, age: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.birthDate]);

  // Validação em tempo real de email
  useEffect(() => {
    if (formData.email && formData.email.trim() !== '') {
      const emailResult = validateEmail(formData.email);
      if (!emailResult.valid) {
        setFieldErrors(prev => ({ ...prev, email: emailResult.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  }, [formData.email]);

  // Validação em tempo real de telefone
  useEffect(() => {
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneResult = validatePhone(formData.phone);
      if (!phoneResult.valid) {
        setFieldErrors(prev => ({ ...prev, phone: phoneResult.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  }, [formData.phone]);

  // Validação em tempo real de email secundário
  useEffect(() => {
    if (formData.email_secondary && formData.email_secondary.trim() !== '') {
      const emailResult = validateEmail(formData.email_secondary);
      if (!emailResult.valid) {
        setFieldErrors(prev => ({ ...prev, email_secondary: emailResult.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email_secondary;
          return newErrors;
        });
      }
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email_secondary;
        return newErrors;
      });
    }
  }, [formData.email_secondary]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Formatar data ao digitar (DD/MM/YYYY)
  const handleDateChange = (field, value) => {
    // Remove caracteres não numéricos
    let cleaned = value.replace(/\D/g, '');
    
    // Formata como DD/MM/YYYY
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 5) {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5, 9);
    }
    
    // Atualiza apenas o campo de exibição (formato DD/MM/YYYY)
    setFormData(prev => ({ ...prev, [field]: cleaned }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validação em tempo real de URLs de anexos
  useEffect(() => {
    if (formData.photoUrl && formData.photoUrl.trim() !== '') {
      const validation = validateAllowedDomain(formData.photoUrl);
      if (!validation.valid) {
        setFieldErrors(prev => ({ ...prev, photoUrl: validation.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.photoUrl;
          return newErrors;
        });
      }
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photoUrl;
        return newErrors;
      });
    }
  }, [formData.photoUrl]);

  useEffect(() => {
    if (formData.cvUrl && formData.cvUrl.trim() !== '') {
      const validation = validateAllowedDomain(formData.cvUrl);
      if (!validation.valid) {
        setFieldErrors(prev => ({ ...prev, cvUrl: validation.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.cvUrl;
          return newErrors;
        });
      }
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cvUrl;
        return newErrors;
      });
    }
  }, [formData.cvUrl]);

  useEffect(() => {
    if (formData.portfolioUrl && formData.portfolioUrl.trim() !== '') {
      const validation = validateAllowedDomain(formData.portfolioUrl);
      if (!validation.valid) {
        setFieldErrors(prev => ({ ...prev, portfolioUrl: validation.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.portfolioUrl;
          return newErrors;
        });
      }
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.portfolioUrl;
        return newErrors;
      });
    }
  }, [formData.portfolioUrl]);

  const validateStep = (step) => {
    const stepErrors = {};
    
    switch(step) {
      case 1: // Identificação e Contato
        if (!formData.fullName || formData.fullName.trim() === '') {
          stepErrors.fullName = 'Nome completo é obrigatório';
        }
        if (!formData.email || formData.email.trim() === '') {
          stepErrors.email = 'E-mail é obrigatório';
        } else {
          const emailResult = validateEmail(formData.email);
          if (!emailResult.valid) {
            stepErrors.email = emailResult.message;
          }
        }
        if (!formData.phone || formData.phone.trim() === '') {
          stepErrors.phone = 'Telefone é obrigatório';
        } else {
          const phoneResult = validatePhone(formData.phone);
          if (!phoneResult.valid) {
            stepErrors.phone = phoneResult.message;
          }
        }
        break;
      case 2: // Dados Pessoais
        if (!formData.birthDate || formData.birthDate.trim() === '') {
          stepErrors.birthDate = 'Data de nascimento é obrigatória';
        }
        const ageVal = formData.age !== undefined && formData.age !== null && String(formData.age).trim() !== '';
        if (!ageVal) {
          stepErrors.age = 'Idade é obrigatória';
        }
        if (!formData.maritalStatus || formData.maritalStatus.trim() === '') {
          stepErrors.maritalStatus = 'Estado civil é obrigatório';
        }
        if (!formData.childrenCount || formData.childrenCount.trim() === '') {
          stepErrors.childrenCount = 'Quantidade de filhos é obrigatória';
        }
        if (!formData.hasLicense || formData.hasLicense.trim() === '') {
          stepErrors.hasLicense = 'Informação sobre CNH é obrigatória';
        }
        if ((!formData.city || formData.city.trim() === '') && (!formData.cityCustom || formData.cityCustom.trim() === '')) {
          stepErrors.city = 'Cidade é obrigatória';
        }
        if (!formData.photoUrl || formData.photoUrl.trim() === '') {
          stepErrors.photoUrl = 'Foto é obrigatória';
        } else {
          const photoValidation = validateAllowedDomain(formData.photoUrl);
          if (!photoValidation.valid) {
            stepErrors.photoUrl = photoValidation.message;
          }
        }
        break;
      case 3: // Formação e Experiência
        if (!formData.education || formData.education.trim() === '') {
          stepErrors.education = 'Formação é obrigatória';
        }
        if (!formData.schoolingLevel || formData.schoolingLevel.trim() === '') {
          stepErrors.schoolingLevel = 'Nível de escolaridade é obrigatório';
        }
        if (!formData.institution || formData.institution.trim() === '') {
          stepErrors.institution = 'Instituição de ensino é obrigatória';
        }
        if (!formData.graduationDate || formData.graduationDate.trim() === '') {
          stepErrors.graduationDate = 'Data de formatura é obrigatória';
        }
        if (!formData.isStudying || formData.isStudying.trim() === '') {
          stepErrors.isStudying = 'Informação sobre estudos atuais é obrigatória';
        }
        if (!formData.experience || formData.experience.trim() === '') {
          stepErrors.experience = 'Experiências anteriores são obrigatórias';
        }
        if (!formData.courses || formData.courses.trim() === '') {
          stepErrors.courses = 'Cursos e certificações são obrigatórios';
        }
        if ((!formData.interestAreas || (Array.isArray(formData.interestAreas) && formData.interestAreas.length === 0)) && 
            (!formData.interestAreasOther || formData.interestAreasOther.trim() === '')) {
          stepErrors.interestAreas = 'Áreas de interesse são obrigatórias';
        }
        if (!formData.cvUrl || formData.cvUrl.trim() === '') {
          stepErrors.cvUrl = 'Currículo é obrigatório';
        } else {
          const cvValidation = validateAllowedDomain(formData.cvUrl);
          if (!cvValidation.valid) {
            stepErrors.cvUrl = cvValidation.message;
          }
        }
        break;
      case 4: // Processo e Fit Cultural
        if ((!formData.source || formData.source.trim() === '') && 
            (!formData.sourceCustom || formData.sourceCustom.trim() === '')) {
          stepErrors.source = 'Origem é obrigatória';
        }
        if (!formData.salaryExpectation || formData.salaryExpectation.trim() === '') {
          stepErrors.salaryExpectation = 'Expectativa salarial é obrigatória';
        }
        if (!formData.canRelocate || formData.canRelocate.trim() === '') {
          stepErrors.canRelocate = 'Disponibilidade para mudança é obrigatória';
        }
        if (!formData.references || formData.references.trim() === '') {
          stepErrors.references = 'Referências profissionais são obrigatórias';
        }
        if (!formData.typeOfApp || formData.typeOfApp.trim() === '') {
          stepErrors.typeOfApp = 'Tipo de candidatura é obrigatório';
        }
        if (!formData.freeField || formData.freeField.trim() === '') {
          stepErrors.freeField = 'Campo livre é obrigatório';
        }
        break;
      case 5: // Anexos
        if (!formData.photoUrl || formData.photoUrl.trim() === '') {
          stepErrors.photoUrl = 'Foto é obrigatória';
        } else {
          const photoValidation = validateAllowedDomain(formData.photoUrl);
          if (!photoValidation.valid) {
            stepErrors.photoUrl = photoValidation.message;
          }
        }
        if (formData.portfolioUrl && formData.portfolioUrl.trim() !== '') {
          const portfolioValidation = validateAllowedDomain(formData.portfolioUrl);
          if (!portfolioValidation.valid) {
            stepErrors.portfolioUrl = portfolioValidation.message;
          }
        }
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Scroll para o primeiro erro
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateForm = () => {
    const validation = validateCandidate(formData, {
      checkRequired: true,
      strictMode: false
    });
    const errs = { ...validation.errors };
    if (!formData.photoUrl || !formData.photoUrl.trim()) {
      errs.photoUrl = 'Foto é obrigatória';
    }
    setErrors(errs);
    return validation.valid && Object.keys(errs).length === 0;
  };

  // Detecta se o e-mail já está no Banco de Talentos (apenas para exibir aviso)
  const isExistingCandidate = formData.email?.trim() &&
    validateEmail(formData.email).valid &&
    publicEmailExists === true;

  const submitForm = async () => {
    // Rate limiting
    const lastSubmit = localStorage.getItem('lastFormSubmit');
    if (lastSubmit) {
      const timeSinceLastSubmit = Date.now() - parseInt(lastSubmit, 10);
      if (timeSinceLastSubmit < 60000) {
        setErrors({ submit: 'Aguarde um momento antes de enviar novamente.' });
        return;
      }
    }

    if (!validateForm()) {
      setCurrentStep(1); // Volta para o primeiro passo se houver erro
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalizar dados antes de enviar e converter para snake_case
      const normalizedData = {
        full_name: formData.fullName,
        email: formData.email,
        email_secondary: formData.email_secondary || null,
        phone: formData.phone,
        birth_date: convertDateToISO(formData.birthDate) || null,
        age: formData.age ? parseInt(formData.age) : null,
        marital_status: formData.maritalStatus || null,
        children_count: normalizeChildrenForStorage(formData.childrenCount) || null,
        has_license: formData.hasLicense || null,
        city: showCityCustom && formData.cityCustom 
          ? normalizeCity(formData.cityCustom) 
          : formData.city 
            ? normalizeCity(formData.city) 
            : null,
        photo_url: formData.photoUrl || null,
        education: formData.education || null,
        schooling_level: formData.schoolingLevel || null,
        institution: formData.institution || null,
        graduation_date: convertDateToISO(formData.graduationDate) || null,
        is_studying: formData.isStudying || null,
        experience: formData.experience || null,
        courses: formData.courses || null,
        certifications: formData.certifications || null,
        interest_areas: (() => {
          let areas = [];
          if (Array.isArray(formData.interestAreas) && formData.interestAreas.length > 0) {
            areas = [...formData.interestAreas];
          }
          if (formData.interestAreasOther && formData.interestAreasOther.trim()) {
            areas.push(...formData.interestAreasOther.split(',').map(a => a.trim()).filter(a => a));
          }
          return areas.length > 0 ? normalizeInterestAreasString(areas.join(', ')) : null;
        })(),
        cv_url: formData.cvUrl || null,
        portfolio_url: formData.portfolioUrl || null,
        source: showSourceCustom && formData.sourceCustom
          ? normalizeSource(formData.sourceCustom)
          : formData.source
            ? normalizeSource(formData.source)
            : 'Formulário Público',
        referral: formData.referral || null,
        salary_expectation: formData.salaryExpectation || null,
        can_relocate: formData.canRelocate || null,
        professional_references: formData.references || null,
        type_of_app: formData.typeOfApp || null,
        free_field: formData.freeField || null,
        // Metadados
        status: 'Inscrito',
        tags: ['Novo Inscrito', 'Formulário Público'],
        origin: 'public_form',
        created_by: 'Formulário Público',
        original_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Remover campos vazios/null e garantir que não há campos não existentes na tabela
      Object.keys(normalizedData).forEach(key => {
        if (normalizedData[key] === '' || normalizedData[key] === null || normalizedData[key] === undefined) {
          delete normalizedData[key];
        }
      });
      
      // Garantir que não há submission_id (caso tenha sido adicionado em algum lugar)
      delete normalizedData.submission_id;

      // Enviar para Supabase (view public.candidates redireciona para young_talents.candidates)
      // O ID gerado automaticamente pelo Supabase será usado para identificar este envio
      const { data: insertedData, error } = await supabase
        .from('candidates')
        .insert([normalizedData])
        .select('id')
        .single();
      
      if (error) throw error;
      
      console.log('Candidato criado com ID:', insertedData?.id);

      localStorage.setItem('lastFormSubmit', Date.now().toString());
      setSubmitSuccess(true);
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/apply/thank-you');
      }, 3000);

    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setErrors({ submit: 'Erro ao enviar formulário. Por favor, tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar antes de mostrar modal
    if (!validateForm()) {
      setCurrentStep(1); // Volta para o primeiro passo se houver erro
      return;
    }

    // Mostrar modal de confirmação
    setShowConfirmModal(true);
  };

  const mainSources = getMainSourcesOptions();
  const mainInterestAreas = getMainInterestAreasOptions();

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 font-young">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <img src="/logo-young-empreendimentos.png" alt="Young Empreendimentos" className="h-12 w-auto mx-auto mb-4" />
          <CheckCircle className="w-16 h-16 text-young-orange mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Formulário Enviado com Sucesso!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Obrigado por se candidatar. Seu formulário foi recebido e será analisado pela nossa equipe.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecionando...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">© 2025 Young Empreendimentos</p>
        </div>
      </div>
    );
  }

  // Componente de progresso
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step === currentStep 
                ? 'bg-young-orange border-young-orange text-white' 
                : step < currentStep 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
            }`}>
              {step < currentStep ? <Check size={20} /> : step}
            </div>
            {step < totalSteps && (
              <div className={`flex-1 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Etapa {currentStep} de {totalSteps}
      </div>
    </div>
  );

  // Renderizar campo de anexo (foto, CV ou portfólio) - apenas URL
  const renderAttachmentField = (fieldName, label, type) => {
    const urlField = `${fieldName}Url`;
    
    return (
      <div className="space-y-3">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          type="url"
          name={urlField}
          value={formData[urlField] || ''}
          onChange={(e) => handleChange(urlField, e.target.value)}
          placeholder={`Cole aqui o link público de ${type === 'photo' ? 'foto' : type === 'cv' ? 'currículo' : 'portfólio'}`}
          required={type === 'photo'}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
            errors[urlField] || fieldErrors[urlField] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
        />
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
            📎 Use links públicos de:
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Google Drive, Dropbox, iCloud, OneDrive, Box, WeTransfer ou MediaFire
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Certifique-se de que o link está configurado como público/aberto para visualização
          </p>
        </div>
        
        {(errors[urlField] || fieldErrors[urlField]) && (
          <p className="text-red-500 text-xs mt-1">
            {errors[urlField] || fieldErrors[urlField]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 font-young">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/logo-young-empreendimentos.png" alt="Young Empreendimentos" className="h-14 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Banco de Talentos - Young Empreendimentos
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
            Neste prático questionário, você vai preencher algumas informações básicas para nós da Young Empreendimentos conhecermos um pouco mais de você e direcioná-lo para as vagas do seu interesse. Será um prazer conhecê-lo!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Campos marcados com <span className="text-red-500">*</span> são obrigatórios
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar />

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          {/* Erro geral */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {isExistingCandidate && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3 mb-6">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                Você já faz parte do nosso Banco de Talentos. Pode continuar mesmo assim para atualizar suas informações.
              </p>
            </div>
          )}

          {/* Step 1: Identificação e Contato */}
          {currentStep === 1 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                1. Identificação e Contato
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">
                Vamos começar pelas suas informações pessoais.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    required
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail Principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                      errors.email || fieldErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    required
                  />
                  {(errors.email || fieldErrors.email) && (
                    <p className="text-red-500 text-xs mt-1">{errors.email || fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail Secundário
                  </label>
                  <input
                    type="email"
                    name="email_secondary"
                    value={formData.email_secondary}
                    onChange={(e) => handleChange('email_secondary', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                      errors.email_secondary || fieldErrors.email_secondary ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {(errors.email_secondary || fieldErrors.email_secondary) && (
                    <p className="text-red-500 text-xs mt-1">{errors.email_secondary || fieldErrors.email_secondary}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefone/WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(51) 99999-9999"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                      errors.phone || fieldErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    required
                  />
                  {(errors.phone || fieldErrors.phone) && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone || fieldErrors.phone}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Dados Pessoais */}
          {currentStep === 2 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                2. Dados Pessoais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={(e) => handleDateChange('birthDate', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    maxLength="10"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                      errors.birthDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Idade
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculada automaticamente</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado Civil <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={(e) => handleChange('maritalStatus', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Namorando">Namorando</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade de Filhos <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="childrenCount"
                    value={formData.childrenCount}
                    onChange={(e) => handleChange('childrenCount', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                      errors.childrenCount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  >
                    <option value="">Selecione...</option>
                    {CHILDREN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.childrenCount && <p className="text-red-500 text-xs mt-1">{errors.childrenCount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Possui CNH Tipo B? <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="hasLicense"
                    value={formData.hasLicense}
                    onChange={(e) => handleChange('hasLicense', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cidade onde Reside <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {!showCityCustom ? (
                      <div className="relative" ref={cityDropdownRef}>
                        <input
                          ref={cityInputRef}
                          type="text"
                          name="city"
                          value={showCityDropdown ? citySearchTerm : (formData.city || '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCitySearchTerm(v);
                            setShowCityDropdown(true);
                            if (!v) handleChange('city', '');
                          }}
                          onFocus={() => {
                            setCitySearchTerm(formData.city || '');
                            setShowCityDropdown(true);
                          }}
                          placeholder="Digite para buscar cidade..."
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                            errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                          autoComplete="off"
                        />
                        {showCityDropdown && cityOptionsFiltered.length > 0 && (
                          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1">
                            {cityOptionsFiltered.map((city) => {
                              const cityValue = city.name?.includes('/') ? city.name : `${city.name}/RS`;
                              const cityDisplay = city.name?.includes('/') ? city.name : `${city.name}/RS`;
                              return (
                                <li
                                  key={city.id}
                                  role="option"
                                  className="px-4 py-2 cursor-pointer hover:bg-young-orange/20 dark:hover:bg-young-orange/30 text-gray-900 dark:text-white"
                                  onClick={() => {
                                    handleChange('city', cityValue);
                                    setCitySearchTerm('');
                                    setShowCityDropdown(false);
                                  }}
                                >
                                  {cityDisplay}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowCityCustom(true);
                            setCitySearchTerm('');
                            handleChange('city', '');
                            setShowCityDropdown(false);
                          }}
                          className="text-sm text-young-orange hover:underline mt-2 block"
                        >
                          + Adicionar outra cidade (formato: Cidade/UF, ex: São Paulo/SP)
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          name="cityCustom"
                          value={formData.cityCustom}
                          onChange={(e) => handleChange('cityCustom', e.target.value)}
                          placeholder="Ex: São Paulo/SP"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                            errors.cityCustom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Formato: Cidade/UF (ex: São Paulo/SP)</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCityCustom(false);
                            handleChange('cityCustom', '');
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                        >
                          ← Voltar para lista
                        </button>
                      </>
                    )}
                  </div>
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div className="md:col-span-2">
                  {renderAttachmentField('photo', 'Foto *', 'photo')}
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Formação e Experiência */}
          {currentStep === 3 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                3. Formação e Experiência
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Formação <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    placeholder="Ex: Engenharia de Software"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nível de Escolaridade <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="schoolingLevel"
                    value={formData.schoolingLevel}
                    onChange={(e) => handleChange('schoolingLevel', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Superior Incompleto">Superior Incompleto</option>
                    <option value="Superior Completo">Superior Completo</option>
                    <option value="Pós-graduação Incompleta">Pós-graduação Incompleta</option>
                    <option value="Pós-graduação Completa">Pós-graduação Completa</option>
                    <option value="Pós-Graduação">Pós-Graduação</option>
                    <option value="Mestrado">Mestrado</option>
                    <option value="Doutorado">Doutorado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Instituição de Ensino <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={(e) => handleChange('institution', e.target.value)}
                    placeholder="Ex: Universidade Federal do Rio Grande do Sul"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Formatura <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="graduationDate"
                    value={formData.graduationDate}
                    onChange={(e) => handleDateChange('graduationDate', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    maxLength="10"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Está Cursando Atualmente? <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="isStudying"
                    value={formData.isStudying}
                    onChange={(e) => handleChange('isStudying', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Experiências Anteriores <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    rows="4"
                    placeholder="Descreva suas experiências profissionais anteriores..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cursos e Certificações Profissionais <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="courses"
                    value={formData.courses}
                    onChange={(e) => handleChange('courses', e.target.value)}
                    rows="3"
                    placeholder="Liste seus cursos e certificações..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Certificações Profissionais
                  </label>
                  <input
                    type="text"
                    name="certifications"
                    value={formData.certifications}
                    onChange={(e) => handleChange('certifications', e.target.value)}
                    placeholder="Ex: AWS Certified Cloud Practitioner"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Áreas de Interesse Profissional <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {mainInterestAreas.map(area => (
                        <label key={area.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={Array.isArray(formData.interestAreas) && formData.interestAreas.includes(area.name)}
                            onChange={(e) => {
                              const currentAreas = Array.isArray(formData.interestAreas) ? formData.interestAreas : [];
                              if (e.target.checked) {
                                handleChange('interestAreas', [...currentAreas, area.name]);
                              } else {
                                handleChange('interestAreas', currentAreas.filter(a => a !== area.name));
                              }
                            }}
                            className="w-4 h-4 text-young-orange border-gray-300 rounded focus:ring-young-orange"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{area.name}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={showInterestAreasOther}
                          onChange={(e) => {
                            setShowInterestAreasOther(e.target.checked);
                            if (!e.target.checked) {
                              handleChange('interestAreasOther', '');
                            }
                          }}
                          className="w-4 h-4 text-young-orange border-gray-300 rounded focus:ring-young-orange"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">Outro</span>
                      </label>
                      {showInterestAreasOther && (
                        <div className="ml-6 mt-2">
                          <input
                            type="text"
                            value={formData.interestAreasOther || ''}
                            onChange={(e) => handleChange('interestAreasOther', e.target.value)}
                            placeholder="Digite outras áreas separadas por vírgula"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.interestAreas && <p className="text-red-500 text-xs mt-1">{errors.interestAreas}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currículo <span className="text-red-500">*</span>
                  </label>
                  {renderAttachmentField('cv', 'Currículo', 'cv')}
                  {errors.cvUrl && <p className="text-red-500 text-xs mt-1">{errors.cvUrl}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Step 4: Processo e Fit Cultural */}
          {currentStep === 4 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                4. Processo e Fit Cultural
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Onde nos Encontrou? <span className="text-red-500">*</span>
                  </label>
                  {!showSourceCustom ? (
                    <>
                      <select
                        name="source"
                        value={formData.source}
                        onChange={(e) => {
                          if (e.target.value === 'outro') {
                            setShowSourceCustom(true);
                            handleChange('source', '');
                          } else {
                            handleChange('source', e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione...</option>
                        {mainSources.filter(source => source.name !== 'Outros').map(source => (
                          <option key={source.id} value={source.name}>{source.name}</option>
                        ))}
                        <option value="outro">Outro (especifique)</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="sourceCustom"
                        value={formData.sourceCustom}
                        onChange={(e) => handleChange('sourceCustom', e.target.value)}
                        placeholder="Especifique onde nos encontrou"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowSourceCustom(false);
                          handleChange('sourceCustom', '');
                        }}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline mt-1"
                      >
                        ← Voltar para lista
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Foi Indicado por Colaborador?
                  </label>
                  <input
                    type="text"
                    name="referral"
                    value={formData.referral}
                    onChange={(e) => handleChange('referral', e.target.value)}
                    placeholder="Nome do colaborador (se aplicável)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expectativa Salarial <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
                    <input
                      type="text"
                      name="salaryExpectation"
                      value={formData.salaryExpectation}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value) {
                          value = (parseInt(value) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                          handleChange('salaryExpectation', `R$ ${value}`);
                        } else {
                          handleChange('salaryExpectation', '');
                        }
                      }}
                      placeholder="0,00"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange ${
                        errors.salaryExpectation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    />
                  </div>
                  {errors.salaryExpectation && <p className="text-red-500 text-xs mt-1">{errors.salaryExpectation}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Disponibilidade para Mudança de Cidade? <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="canRelocate"
                    value={formData.canRelocate}
                    onChange={(e) => handleChange('canRelocate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                    <option value="Talvez">Talvez</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Referências Profissionais <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="references"
                    value={formData.references}
                    onChange={(e) => handleChange('references', e.target.value)}
                    rows="3"
                    placeholder="Nome, cargo, empresa e contato..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Candidatura <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="typeOfApp"
                    value={formData.typeOfApp}
                    onChange={(e) => handleChange('typeOfApp', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Vaga Específica">Vaga Específica</option>
                    <option value="Banco de Talentos">Banco de Talentos</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Campo Livre - SEJA VOCÊ! <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="freeField"
                    value={formData.freeField}
                    onChange={(e) => handleChange('freeField', e.target.value)}
                    rows="4"
                    placeholder="Conte-nos sobre você, suas paixões, objetivos e o que te motiva..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-young-orange focus:border-young-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 5: Anexos */}
          {currentStep === 5 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                5. Anexos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Portfólio (opcional)
                  </label>
                  {renderAttachmentField('portfolio', 'Portfólio', 'portfolio')}
                </div>
              </div>
            </section>
          )}

          {/* Navegação entre etapas */}
          <div className="flex justify-between gap-4 pt-6 mt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={currentStep === 1 ? () => navigate('/') : handlePrevious}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-young-orange hover:bg-young-orange-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Próximo
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-young-orange hover:bg-young-orange-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Formulário
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirmar Envio
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Você conferiu todas as informações e tem certeza que deseja enviar o formulário?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    submitForm();
                  }}
                  className="px-4 py-2 bg-young-orange hover:bg-young-orange-hover text-white rounded-lg font-medium transition-colors"
                >
                  Sim, tenho certeza
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-8 text-center">© 2025 Young Empreendimentos</p>
      </div>
    </div>
  );
};

export default PublicCandidateForm;
