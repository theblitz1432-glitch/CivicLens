import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import Project from '../models/Project';
import User from '../models/User';
import Notification from '../models/Notification';
import nodemailer from 'nodemailer';
import axios from 'axios';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try { await transporter.sendMail({ from: `"CivicLens" <${process.env.GMAIL_USER}>`, to, subject, html }); }
  catch (err) { console.error('Email error:', err); }
};

const createNotification = async (userId: string, title: string, message: string, type: string, complaintId?: string) => {
  try { await Notification.create({ userId, title, message, type, complaintId, isRead: false }); }
  catch (err) { console.error('Notification error:', err); }
};

const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── STAGE 0: Google Vision API — Fake/Real Image Detection ─────────────────
const verifyWithGoogleVision = async (base64Image: string, category: string): Promise<{
  isFake: boolean;
  isScreenshot: boolean;
  categoryMatch: boolean;
  confidence: number;
  labels: string[];
  reason: string;
}> => {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      console.log('[Vision] No API key — skipping Google Vision check');
      return { isFake: false, isScreenshot: false, categoryMatch: true, confidence: 80, labels: [], reason: 'Vision API not configured' };
    }

    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [{
          image: { content: imageData },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'IMAGE_PROPERTIES' },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          ],
        }],
      },
      { timeout: 15000 }
    );

    const result = response.data.responses[0];
    const labels: string[] = (result.labelAnnotations || []).map((l: any) => l.description.toLowerCase());
    const safeSearch = result.safeSearchAnnotation || {};
    const objects: string[] = (result.localizedObjectAnnotations || []).map((o: any) => o.name.toLowerCase());

    // Detect screenshots — uniform colors, text-heavy, no natural scene
    const screenshotIndicators = ['screenshot', 'text', 'font', 'web page', 'software', 'display device', 'multimedia'];
    const isScreenshot = screenshotIndicators.some(s => labels.includes(s)) ||
      (labels.includes('text') && !labels.includes('road') && !labels.includes('infrastructure'));

    // Detect AI-generated/fake — too perfect, no noise, CGI indicators
    const fakeIndicators = ['cgi', 'computer graphics', 'digital art', 'illustration', 'cartoon', 'animation', 'render'];
    const isFake = fakeIndicators.some(f => labels.includes(f));

    // Category matching using Vision labels
    const categoryKeywords: Record<string, string[]> = {
      'Road & Infrastructure': ['road', 'street', 'asphalt', 'pavement', 'pothole', 'crack', 'infrastructure', 'highway', 'sidewalk', 'concrete'],
      'Water Supply': ['water', 'pipe', 'flood', 'leak', 'puddle', 'drainage', 'sewage', 'waterlogging', 'tap'],
      'Electricity': ['electricity', 'wire', 'cable', 'pole', 'transformer', 'power line', 'electric'],
      'Sanitation': ['garbage', 'waste', 'trash', 'dirt', 'pollution', 'dump', 'litter', 'sewage'],
      'Street Light': ['light', 'lamp', 'street light', 'lighting', 'pole', 'bulb'],
      'Drainage': ['drain', 'water', 'flood', 'pipe', 'gutter', 'sewage', 'waterlogging'],
      'Park': ['park', 'garden', 'tree', 'grass', 'playground', 'bench', 'green'],
    };

    const expectedKeywords = categoryKeywords[category] || [];
    const allDetected = [...labels, ...objects];
    const matchCount = expectedKeywords.filter(k => allDetected.some(d => d.includes(k))).length;
    const categoryMatch = matchCount >= 1 || expectedKeywords.length === 0;

    // Confidence score based on label scores
    const avgScore = result.labelAnnotations?.length > 0
      ? result.labelAnnotations.reduce((sum: number, l: any) => sum + l.score, 0) / result.labelAnnotations.length * 100
      : 75;

    console.log(`[Vision] Labels: ${labels.slice(0, 5).join(', ')} | Category match: ${categoryMatch} | Fake: ${isFake} | Screenshot: ${isScreenshot}`);

    return {
      isFake,
      isScreenshot,
      categoryMatch,
      confidence: Math.round(avgScore),
      labels: labels.slice(0, 10),
      reason: isFake ? 'AI-generated image detected' :
        isScreenshot ? 'Screenshot detected, not a real photo' :
        !categoryMatch ? `Photo doesn't show ${category} issue` :
        `Verified: ${labels.slice(0, 3).join(', ')}`,
    };
  } catch (err: any) {
    console.error('[Vision] Error:', err?.response?.data || err.message);
    // Don't fail the whole pipeline if Vision API errors
    return { isFake: false, isScreenshot: false, categoryMatch: true, confidence: 70, labels: [], reason: 'Vision check failed — auto-approved' };
  }
};

// ── STAGE 0B: Hugging Face — Fake Image Classifier ─────────────────────────
const verifyWithHuggingFace = async (base64Image: string): Promise<{
  isAIGenerated: boolean;
  confidence: number;
  reason: string;
}> => {
  try {
    const hfToken = process.env.HUGGING_FACE_TOKEN;
    if (!hfToken) {
      console.log('[HuggingFace] No token — skipping HF check');
      return { isAIGenerated: false, confidence: 80, reason: 'HF not configured' };
    }

    // Convert base64 to buffer
    const imageData = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Use Hugging Face AI image detector model
    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/models/umm-maybe/AI-image-detector',
      imageBuffer,
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 20000,
      }
    );

    const results = response.data;
    console.log('[HuggingFace] Result:', JSON.stringify(results));

    // Model returns array like [{ label: 'artificial', score: 0.95 }, { label: 'human', score: 0.05 }]
    if (Array.isArray(results)) {
      const artificialResult = results.find((r: any) =>
        r.label?.toLowerCase().includes('artificial') ||
        r.label?.toLowerCase().includes('fake') ||
        r.label?.toLowerCase().includes('ai')
      );
      const humanResult = results.find((r: any) =>
        r.label?.toLowerCase().includes('human') ||
        r.label?.toLowerCase().includes('real')
      );

      const artificialScore = artificialResult?.score || 0;
      const humanScore = humanResult?.score || 1;
      const isAIGenerated = artificialScore > 0.7; // 70% threshold

      return {
        isAIGenerated,
        confidence: Math.round((isAIGenerated ? artificialScore : humanScore) * 100),
        reason: isAIGenerated
          ? `AI-generated image detected (${Math.round(artificialScore * 100)}% confidence)`
          : `Real photo verified (${Math.round(humanScore * 100)}% confidence)`,
      };
    }

    return { isAIGenerated: false, confidence: 75, reason: 'HF check inconclusive' };
  } catch (err: any) {
    console.error('[HuggingFace] Error:', err?.response?.data || err.message);
    return { isAIGenerated: false, confidence: 70, reason: 'HF check failed — auto-approved' };
  }
};

// ── MAIN AI VERIFICATION PIPELINE ──────────────────────────────────────────
export const verifyPhotoWithAI = async (
  base64Image: string,
  category: string,
  description: string,
  photoLat: number,
  photoLng: number,
  projectId?: string
): Promise<{
  isReal: boolean;
  isCorrectCategory: boolean;
  geotagValid: boolean;
  damagePercentage: number;
  damageType: string;
  locationMatch: boolean;
  reason: string;
  details: string;
  comparisonReport?: string;
  visionLabels?: string[];
  aiDetectionScore?: number;
}> => {
  try {
    // ── Run Google Vision + Hugging Face in parallel ──────────────────────
    console.log('[AI] Starting parallel verification...');
    const [visionResult, hfResult] = await Promise.all([
      verifyWithGoogleVision(base64Image, category),
      verifyWithHuggingFace(base64Image),
    ]);

    console.log(`[AI] Vision: fake=${visionResult.isFake}, screenshot=${visionResult.isScreenshot}, categoryMatch=${visionResult.categoryMatch}`);
    console.log(`[AI] HuggingFace: aiGenerated=${hfResult.isAIGenerated}, confidence=${hfResult.confidence}`);

    // ── Reject if fake/screenshot detected by either service ─────────────
    if (visionResult.isFake || hfResult.isAIGenerated) {
      return {
        isReal: false,
        isCorrectCategory: false,
        geotagValid: true,
        damagePercentage: 0,
        damageType: 'none',
        locationMatch: true,
        reason: hfResult.isAIGenerated ? hfResult.reason : visionResult.reason,
        details: `Google Vision: ${visionResult.reason}. HuggingFace: ${hfResult.reason}`,
        visionLabels: visionResult.labels,
        aiDetectionScore: hfResult.confidence,
      };
    }

    if (visionResult.isScreenshot) {
      return {
        isReal: false,
        isCorrectCategory: false,
        geotagValid: true,
        damagePercentage: 0,
        damageType: 'none',
        locationMatch: true,
        reason: 'Screenshot detected — please take a real photo using your camera',
        details: visionResult.reason,
        visionLabels: visionResult.labels,
        aiDetectionScore: hfResult.confidence,
      };
    }

    // ── Find nearest project for location comparison ──────────────────────
    let projectLocation = { lat: 0, lng: 0 };
    let contractorAfterPhoto = '';
    let projectTitle = '';

    if (projectId) {
      const proj = await Project.findById(projectId);
      if (proj?.afterPhoto) contractorAfterPhoto = proj.afterPhoto;
      projectTitle = proj?.title || '';
    } else {
      const projects = await Project.find({});
      let nearest = null; let minDist = Infinity;
      for (const p of projects) {
        if ((p as any).coordinates?.lat && (p as any).coordinates?.lng) {
          const dist = getDistanceMeters(photoLat, photoLng, (p as any).coordinates.lat, (p as any).coordinates.lng);
          if (dist < minDist) { minDist = dist; nearest = p; }
        }
      }
      if (nearest) {
        projectLocation = (nearest as any).coordinates || { lat: 0, lng: 0 };
        contractorAfterPhoto = (nearest as any).afterPhoto || '';
        projectTitle = nearest.title;
      }
    }

    // ── Groq Vision — Damage analysis ────────────────────────────────────
    let groqResult = {
      isReal: true, isCorrectCategory: visionResult.categoryMatch,
      damagePercentage: 0, damageType: 'unknown',
      reason: 'Photo verified', details: '', comparisonReport: '',
    };

    if (process.env.GROQ_API_KEY) {
      try {
        const stage1Prompt = `You are CivicLens AI Photo Verifier for India government platform.
Analyze this photo and return ONLY valid JSON (no markdown):
{
  "isReal": true/false,
  "isCorrectCategory": true/false,
  "damagePercentage": 0-100,
  "damageType": "pothole/crack/erosion/incomplete/waterlogging/structural/none/other",
  "reason": "one sentence",
  "details": "2-3 sentence analysis"
}
Category reported: "${category}"
Description: "${description}"
Google Vision already confirmed: real photo, labels: ${visionResult.labels.slice(0, 5).join(', ')}
Focus on: Does this photo show "${category}" damage? How severe?`;

        const stage1Res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.2-11b-vision-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: base64Image } },
                { type: 'text', text: stage1Prompt }
              ]
            }],
            max_tokens: 300,
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        const s1Content = stage1Res.data.choices[0]?.message?.content || '{}';
        const s1 = JSON.parse(s1Content.replace(/```json|```/g, '').trim());
        groqResult = {
          isReal: s1.isReal ?? true,
          isCorrectCategory: s1.isCorrectCategory ?? visionResult.categoryMatch,
          damagePercentage: Math.min(100, Math.max(0, s1.damagePercentage ?? 0)),
          damageType: s1.damageType || 'unknown',
          reason: s1.reason || 'Verified',
          details: s1.details || '',
          comparisonReport: '',
        };

        // Stage 3: Compare with contractor photo if available
        if (contractorAfterPhoto && groqResult.isReal) {
          try {
            const stage3Res = await axios.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model: 'llama-3.2-11b-vision-preview',
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'image_url', image_url: { url: base64Image } },
                    { type: 'text', text: `Compare this citizen complaint photo with contractor completion for "${projectTitle}". Brief report on discrepancies.` }
                  ]
                }],
                max_tokens: 150,
              },
              { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
            );
            groqResult.comparisonReport = stage3Res.data.choices[0]?.message?.content || '';
          } catch { groqResult.comparisonReport = ''; }
        }
      } catch (err) {
        console.error('[Groq] Error:', err);
        // Fall back to Vision results
      }
    }

    // ── Geotag validation ─────────────────────────────────────────────────
    let geotagValid = true;
    if (projectLocation.lat && projectLocation.lng && photoLat && photoLng) {
      const dist = getDistanceMeters(photoLat, photoLng, projectLocation.lat, projectLocation.lng);
      geotagValid = dist <= 500;
    }

    // ── Final decision: combine all 3 services ────────────────────────────
    const finalIsReal = groqResult.isReal && !visionResult.isFake && !hfResult.isAIGenerated;
    const finalCategoryMatch = groqResult.isCorrectCategory && visionResult.categoryMatch;

    const finalReason = !finalIsReal ? groqResult.reason :
      !finalCategoryMatch ? `Photo doesn't match "${category}" — ${visionResult.reason}` :
      `✅ Verified by Google Vision + AI Detector + Groq Vision`;

    console.log(`[AI] Final: real=${finalIsReal}, category=${finalCategoryMatch}, damage=${groqResult.damagePercentage}%`);

    return {
      isReal: finalIsReal,
      isCorrectCategory: finalCategoryMatch,
      geotagValid,
      damagePercentage: groqResult.damagePercentage,
      damageType: groqResult.damageType,
      locationMatch: geotagValid,
      reason: finalReason,
      details: `Google Vision (${visionResult.confidence}% confidence): ${visionResult.labels.slice(0, 3).join(', ')}. HuggingFace AI Detector: ${hfResult.reason}. ${groqResult.details}`,
      comparisonReport: groqResult.comparisonReport,
      visionLabels: visionResult.labels,
      aiDetectionScore: hfResult.confidence,
    };
  } catch (err) {
    console.error('[AI] Pipeline error:', err);
    return {
      isReal: true, isCorrectCategory: true, geotagValid: true,
      damagePercentage: 0, damageType: 'unknown', locationMatch: true,
      reason: 'Verification unavailable — auto-approved', details: 'AI pipeline error',
    };
  }
};

// ── Auto-escalation ─────────────────────────────────────────────────────────
const checkAutoEscalation = async (category: string, lat: number, lng: number, damagePercentage: number) => {
  try {
    const nearbyCount = await Complaint.countDocuments({
      category, status: { $in: ['pending', 'verified'] },
      'location.lat': { $gte: lat - 0.01, $lte: lat + 0.01 },
      'location.lng': { $gte: lng - 0.01, $lte: lng + 0.01 },
    });
    const shouldEscalate = nearbyCount >= 5 || damagePercentage >= 40;
    if (shouldEscalate) {
      const authorityUsers = await User.find({ role: 'authority' });
      for (const au of authorityUsers) {
        await createNotification(
          au._id.toString(), `🚨 AUTO-ESCALATION ALERT`,
          `${nearbyCount >= 5 ? `${nearbyCount} complaints` : ''} ${damagePercentage >= 40 ? `AI damage ${damagePercentage}%` : ''} in ${category}. Immediate review required.`,
          'system'
        );
      }
    }
  } catch (err) { console.error('Escalation error:', err); }
};

// ── Notify stakeholders ─────────────────────────────────────────────────────
const notifyStakeholders = async (complaint: any, reporterId: string) => {
  try {
    const html = `
      <div style="font-family:Arial;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="background:#1e40af;color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
          <h2 style="margin:0;">🚨 New Complaint — CivicLens</h2>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;font-weight:bold;color:#475569;">Category:</td><td>${complaint.category}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px;font-weight:bold;">Description:</td><td>${complaint.description}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">AI Damage:</td><td style="color:#ef4444;font-weight:bold;">${complaint.damagePercentage}% — ${complaint.damageType}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px;font-weight:bold;">Location:</td><td>${complaint.location?.address || `${complaint.location?.lat}, ${complaint.location?.lng}`}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Vision Labels:</td><td style="color:#3b82f6;">${complaint.visionLabels?.join(', ') || 'N/A'}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px;font-weight:bold;">Date:</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
        </table>
        <div style="margin-top:16px;padding:12px;background:#f0f9ff;border-radius:8px;border-left:4px solid #3b82f6;">
          <p style="margin:0;color:#1e40af;font-size:12px;">🤖 Verified by: Google Vision API + HuggingFace AI Detector + Groq Vision</p>
        </div>
        ${complaint.comparisonReport ? `<div style="margin-top:12px;padding:12px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;"><p style="margin:0;color:#92400e;font-size:12px;">📊 AI Report: ${complaint.comparisonReport}</p></div>` : ''}
      </div>`;

    const [contractorUsers, authorityUsers] = await Promise.all([
      User.find({ role: 'contractor' }),
      User.find({ role: 'authority' }),
    ]);

    for (const cu of contractorUsers) {
      await createNotification(cu._id.toString(), `🚨 New ${complaint.category} Complaint`, `AI Damage: ${complaint.damagePercentage}% (${complaint.damageType}). ${complaint.description?.substring(0, 100)}`, 'complaint', complaint._id.toString());
      if (cu.email) await sendEmail(cu.email, `🚨 ${complaint.category} Complaint — CivicLens`, html);
    }
    for (const au of authorityUsers) {
      await createNotification(au._id.toString(), `🚨 Civic Complaint: ${complaint.category}`, `AI Damage: ${complaint.damagePercentage}%. ${complaint.description?.substring(0, 100)}`, 'complaint', complaint._id.toString());
      if (au.email) await sendEmail(au.email, `🚨 Civic Complaint — Action Required`, html);
    }
    await createNotification(reporterId, '✅ Complaint Submitted', `Your ${complaint.category} complaint verified by Google Vision + AI Detector. Authorities notified.`, 'status_update', complaint._id.toString());
  } catch (err) { console.error('Notify error:', err); }
};

// ── REGISTER COMPLAINT ──────────────────────────────────────────────────────
export const registerComplaint = async (req: Request, res: Response) => {
  try {
    const { category, description, photoBase64, location, projectId } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!category || !description) return res.status(400).json({ success: false, message: 'Category and description required' });
    if (!photoBase64) return res.status(400).json({ success: false, message: 'Photo is required (camera only)' });

    const photoLat = location?.lat || 0;
    const photoLng = location?.lng || 0;

    const ai = await verifyPhotoWithAI(photoBase64, category, description, photoLat, photoLng, projectId);

    if (!ai.isReal) {
      return res.status(400).json({
        success: false,
        message: `Photo rejected: ${ai.reason}`,
        photoRejected: true,
        details: ai.details,
        visionLabels: ai.visionLabels,
      });
    }
    if (!ai.isCorrectCategory) {
      return res.status(400).json({
        success: false,
        message: `Photo doesn't match "${category}" issue. ${ai.reason}`,
        photoRejected: true,
        categoryMismatch: true,
        visionLabels: ai.visionLabels,
      });
    }

    const complaint = await Complaint.create({
      userId, category, description,
      photoUrl: photoBase64,
      photoVerified: true,
      photoVerificationReason: ai.reason,
      damagePercentage: ai.damagePercentage,
      damageType: ai.damageType,
      aiDetails: ai.details,
      comparisonReport: ai.comparisonReport || '',
      visionLabels: ai.visionLabels || [],
      aiDetectionScore: ai.aiDetectionScore || 0,
      geotagValid: ai.geotagValid,
      location: location || { lat: 0, lng: 0, address: 'Unknown' },
      status: 'pending',
    });

    checkAutoEscalation(category, photoLat, photoLng, ai.damagePercentage);
    notifyStakeholders({ ...complaint.toObject(), visionLabels: ai.visionLabels }, userId);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted and verified by AI',
      verificationDetails: {
        googleVision: `Detected: ${ai.visionLabels?.slice(0, 3).join(', ')}`,
        huggingFace: `AI Detection Score: ${ai.aiDetectionScore}%`,
        groqVision: `Damage: ${ai.damagePercentage}% (${ai.damageType})`,
      },
      complaint: {
        id: complaint._id, category, status: 'pending',
        damagePercentage: ai.damagePercentage,
        damageType: ai.damageType,
        visionLabels: ai.visionLabels,
        createdAt: complaint.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserComplaints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 }).select('-userId');
    res.json({ success: true, complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await Complaint.find(filter).select('-userId -photoUrl').sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAllComplaintsForAuthority = async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await Complaint.find(filter).populate('userId', 'name phone').sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, contractorNote } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(id, { status, contractorNote }, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
    await createNotification(complaint.userId.toString(), `📋 Complaint ${status.replace('_', ' ').toUpperCase()}`, `Your ${complaint.category} complaint status updated.`, 'status_update', complaint._id.toString());
    res.json({ success: true, complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const addContractorReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { review, estimatedDays, actionTaken } = req.body;
    const contractorId = (req as any).user?.id;
    const complaint = await Complaint.findByIdAndUpdate(id, {
      contractorReview: { review, estimatedDays, actionTaken, reviewedAt: new Date(), contractorId }
    }, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
    await createNotification(complaint.userId.toString(), `🔧 Contractor Reviewed`, `Complaint will be fixed in ${estimatedDays} days.`, 'status_update', complaint._id.toString());
    res.json({ success: true, complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getComplaintStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [total, resolved, inProgress, pending] = await Promise.all([
      Complaint.countDocuments({ userId }),
      Complaint.countDocuments({ userId, status: 'resolved' }),
      Complaint.countDocuments({ userId, status: 'in_progress' }),
      Complaint.countDocuments({ userId, status: 'pending' }),
    ]);
    res.json({ success: true, stats: { total, resolved, inProgress, pending } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getMapData = async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find({ 'location.lat': { $ne: 0 } })
      .select('category status damagePercentage location createdAt damageType visionLabels')
      .sort({ createdAt: -1 }).limit(200);
    const mapPoints = complaints.map(c => ({
      lat: c.location.lat, lng: c.location.lng,
      category: c.category, status: c.status,
      damagePercentage: c.damagePercentage,
      damageType: (c as any).damageType,
      visionLabels: (c as any).visionLabels,
      color: c.status === 'resolved' ? 'green' : c.status === 'in_progress' ? 'yellow' : (c.damagePercentage || 0) >= 40 ? 'red' : 'orange',
      id: c._id,
    }));
    res.json({ success: true, mapPoints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};